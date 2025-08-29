import { Page, expect } from '@playwright/test';
import { config } from '../e2e/config';

/**
 * Authentication utilities for Playwright tests
 * Provides consistent login methods for all user roles
 */

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Clear all storage before authentication
   */
  async clearStorage() {
    await this.page.context().clearCookies();
    try {
      await this.page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
  }

  /**
   * Navigate to login page and ensure it loads properly
   */
  async goToLogin() {
    await this.page.goto('/login');
    await expect(this.page.locator('h2:has-text("Welcome back")')).toBeVisible();
    await expect(this.page.locator('input[type="email"]')).toBeVisible();
    await expect(this.page.locator('input[type="password"]')).toBeVisible();
  }

  /**
   * Quick login using role-specific buttons
   */
  async quickLogin(role: 'admin' | 'staff' | 'driver' | 'customer') {
    await this.clearStorage();
    await this.goToLogin();

    const buttonText = role.charAt(0).toUpperCase() + role.slice(1);
    await this.page.click(`button:has-text("${buttonText}")`);

    // Wait for appropriate redirect
    const expectedUrls = {
      admin: '/admin',
      staff: '/staff',
      driver: '/driver',
      customer: '/portal',
    };

    await this.page.waitForURL(expectedUrls[role], { timeout: 10000 });

    // Verify landing page
    const expectedHeadings = {
      admin: 'Admin Dashboard',
      staff: 'Staff Dashboard',
      driver: 'Driver Portal',
      customer: 'Shipnorth|Customer Portal|Your Packages',
    };

    await expect(this.page.locator(`h1:has-text("${expectedHeadings[role]}")`)).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * Manual login with credentials
   */
  async manualLogin(role: 'admin' | 'staff' | 'driver' | 'customer') {
    await this.clearStorage();
    await this.goToLogin();

    const user = config.testUsers[role];
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');

    // Wait for appropriate redirect
    const expectedUrls = {
      admin: '/admin',
      staff: '/staff',
      driver: '/driver',
      customer: '/portal',
    };

    await this.page.waitForURL(expectedUrls[role], { timeout: 10000 });
  }

  /**
   * Login with invalid credentials (for error testing)
   */
  async loginWithInvalidCredentials() {
    await this.clearStorage();
    await this.goToLogin();

    await this.page.fill('input[type="email"]', 'invalid@example.com');
    await this.page.fill('input[type="password"]', 'wrongpassword');
    await this.page.click('button[type="submit"]');

    // Should show error and stay on login page
    await expect(
      this.page.locator(
        'text=/Invalid credentials/i, text=/Authentication failed/i, text=/Login failed/i'
      )
    ).toBeVisible({ timeout: 5000 });
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Test session persistence
   */
  async testSessionPersistence(role: 'admin' | 'staff' | 'driver' | 'customer') {
    await this.quickLogin(role);

    // Refresh page
    await this.page.reload();

    // Should still be logged in
    const expectedUrls = {
      admin: '/admin',
      staff: '/staff',
      driver: '/driver',
      customer: '/portal',
    };

    await expect(this.page).toHaveURL(expectedUrls[role]);
  }

  /**
   * Test logout functionality
   */
  async testLogout() {
    // Look for logout button/link
    const logoutButton = this.page
      .locator(
        'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")'
      )
      .first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login or home page
      await this.page.waitForURL(/\/(login)?$/, { timeout: 5000 });

      return true;
    }

    return false;
  }

  /**
   * Test protected route redirection
   */
  async testProtectedRoutes() {
    await this.clearStorage();

    // Try accessing protected routes without authentication
    const protectedRoutes = ['/staff', '/admin', '/driver', '/portal'];

    for (const route of protectedRoutes) {
      await this.page.goto(route);
      await this.page.waitForURL('/login', { timeout: 5000 });
    }
  }
}
