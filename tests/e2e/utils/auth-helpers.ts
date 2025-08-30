import { Page, expect } from '@playwright/test';
import { config } from '../config';

export type UserRole = 'admin' | 'staff' | 'driver' | 'customer';

export class AuthHelpers {
  constructor(private page: Page) {}

  async goToLogin(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.locator('h2:has-text("Welcome back")')).toBeVisible();
  }

  async clearStorage(): Promise<void> {
    await this.page.context().clearCookies();
    try {
      await this.page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      // Ignore localStorage access errors in some contexts
    }
  }

  async quickLogin(role: UserRole): Promise<void> {
    await this.clearStorage();
    await this.goToLogin();

    const buttonText = role.charAt(0).toUpperCase() + role.slice(1);

    // Handle specific case for staff vs admin buttons
    let quickLoginButton;
    if (role === 'staff') {
      // Use exact match to avoid matching "Staff (Admin)"
      quickLoginButton = this.page.getByRole('button', { name: 'Staff', exact: true });
    } else if (role === 'admin') {
      quickLoginButton = this.page.getByRole('button', { name: 'Staff (Admin)' });
    } else {
      quickLoginButton = this.page.locator(`button:has-text("${buttonText}")`).first();
    }

    await expect(quickLoginButton).toBeVisible();

    // Wait for any loading states to complete before clicking
    await this.page.waitForTimeout(1000);

    await quickLoginButton.click();

    // Wait for the API call to complete and navigation to start
    await this.page.waitForTimeout(2000);

    // Check for any error messages before waiting for navigation
    const errorMessage = this.page.locator(
      'text=/Invalid credentials/i, text=/Authentication failed/i, text=/Login failed/i, text=/Unable to connect/i, text=/Network error/i'
    );
    if (await errorMessage.isVisible()) {
      throw new Error(`Login failed: ${await errorMessage.textContent()}`);
    }

    // Wait for navigation with better error handling
    const expectedUrl = role === 'customer' ? '/portal' : role === 'admin' ? '/staff' : `/${role}`;
    
    try {
      await this.page.waitForURL(new RegExp(expectedUrl.replace('/', '\\/') + '\\/?'), {
        timeout: 20000, // Increased timeout
      });
    } catch (urlError) {
      // Debug current URL and page state
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      
      console.log(`❌ Login redirect failed for ${role}`);
      console.log(`   Expected URL pattern: ${expectedUrl}`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Page title: ${pageTitle}`);
      
      // Check for error messages on page
      const errorText = await this.page.locator('text=/error|failed|invalid/i').textContent().catch(() => 'none');
      if (errorText !== 'none') {
        console.log(`   Error on page: ${errorText}`);
      }
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: `test-artifacts/login-debug-${role}-${Date.now()}.png` });
      
      throw new Error(`Login redirect timeout: expected ${expectedUrl}, got ${currentUrl}`);
    }

    const expectedHeading = this.getExpectedHeading(role);
    await expect(this.page.locator(expectedHeading)).toBeVisible({ timeout: 10000 });
  }

  async manualLogin(role: UserRole): Promise<void> {
    await this.clearStorage();
    await this.goToLogin();

    const user = config.testUsers[role];
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');

    const expectedUrl = role === 'customer' ? '/portal' : `/${role}`;
    await this.page.waitForURL(new RegExp(expectedUrl.replace('/', '\\/') + '\\/?'), {
      timeout: 10000,
    });

    const expectedHeading = this.getExpectedHeading(role);
    await expect(this.page.locator(expectedHeading)).toBeVisible({ timeout: 10000 });
  }

  async loginWithInvalidCredentials(): Promise<void> {
    await this.goToLogin();

    await this.page.fill('input[type="email"]', 'invalid@example.com');
    await this.page.fill('input[type="password"]', 'wrongpassword');
    await this.page.click('button[type="submit"]');

    // Should show error message and stay on login page
    await expect(
      this.page.locator(
        'text=/Invalid credentials/i, text=/Authentication failed/i, text=/Login failed/i'
      )
    ).toBeVisible({ timeout: 5000 });
    await expect(this.page).toHaveURL('/login');
  }

  async testLogout(): Promise<boolean> {
    const logoutButton = this.page
      .locator(
        'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")'
      )
      .first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.page.waitForURL(/\/(login)?$/, { timeout: 5000 });
      return true;
    }

    return false;
  }

  async testProtectedRoutes(): Promise<void> {
    const protectedRoutes = ['/staff', '/admin', '/driver', '/portal'];

    for (const route of protectedRoutes) {
      await this.page.goto(route);
      await this.page.waitForURL('/login', { timeout: 5000 });
    }
  }

  async testSessionPersistence(role: UserRole): Promise<void> {
    await this.quickLogin(role);

    // Refresh page
    await this.page.reload();

    const expectedUrl = role === 'customer' ? '/portal' : `/${role}`;
    await expect(this.page).toHaveURL(expectedUrl);

    const expectedHeading = this.getExpectedHeading(role);
    await expect(this.page.locator(expectedHeading)).toBeVisible();
  }

  private getExpectedHeading(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'h1:has-text("Loads"), h1:has-text("Staff Dashboard"), h1:has-text("Dashboard")'; // Admin goes to staff portal
      case 'staff':
        return 'h1:has-text("Loads"), h1:has-text("Staff Dashboard"), h1:has-text("Dashboard")';
      case 'driver':
        return 'h1:has-text("Driver Portal"), h1:has-text("Driver")';
      case 'customer':
        return 'h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")';
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  async waitForLoadingToComplete(): Promise<void> {
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(
      () => {
        const loadingElements = document.querySelectorAll(
          '[data-testid="loading"], .loading, .spinner'
        );
        return loadingElements.length === 0;
      },
      { timeout: 10000 }
    );
  }

  async expectUserRole(role: UserRole): Promise<void> {
    const expectedUrl = role === 'customer' ? '/portal' : `/${role}`;
    await expect(this.page).toHaveURL(expectedUrl);

    const expectedHeading = this.getExpectedHeading(role);
    await expect(this.page.locator(expectedHeading)).toBeVisible();
  }
}
