import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Customer Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.webUrl);
  });

  test('should display login form with proper elements', async ({ page }) => {
    await page.goto('/login');

    // Check all form elements exist
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-register-link"]')).toBeVisible();

    // Check form labels and placeholders
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();

    // Check branding elements
    await expect(page.locator('[data-testid="login-logo"]')).toBeVisible();
    await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
  });

  test('should handle valid customer login successfully', async ({ page }) => {
    await page.goto('/login');

    // Fill in valid credentials
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    // Submit form and wait for navigation
    const submitButton = page.locator('[data-testid="login-submit"]');
    await expect(submitButton).toBeEnabled();

    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), submitButton.click()]);

    // Should redirect to customer portal
    await expect(page).toHaveURL(new RegExp('.*/portal'));
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();

    // Check for user-specific elements
    await expect(page.locator('[data-testid="user-email"]')).toContainText(
      config.testUsers.customer.email
    );
  });

  test('should handle invalid credentials properly', async ({ page }) => {
    await page.goto('/login');

    // Test with invalid email
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      /invalid credentials|login failed/i
    );

    // Should stay on login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    // Test invalid email formats
    const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test.com'];

    for (const email of invalidEmails) {
      await page.fill('[data-testid="login-email"]', email);
      await page.fill('[data-testid="login-password"]', 'password');
      await page.click('[data-testid="login-submit"]');

      // Should show validation error
      const emailField = page.locator('[data-testid="login-email"]');
      await expect(emailField).toBeInvalid();
    }
  });

  test('should handle password field requirements', async ({ page }) => {
    await page.goto('/login');

    // Test empty password
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', '');

    const submitButton = page.locator('[data-testid="login-submit"]');
    await submitButton.click();

    // Should prevent submission
    const passwordField = page.locator('[data-testid="login-password"]');
    await expect(passwordField).toBeInvalid();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');

    // Click register link
    await page.click('[data-testid="login-register-link"]');

    // Should navigate to registration
    await expect(page).toHaveURL(new RegExp('.*/register'));
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  });

  test('should handle role-based redirects correctly', async ({ page }) => {
    // Test admin login redirects to admin dashboard
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.admin.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.admin.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    await expect(page).toHaveURL(new RegExp('.*/admin'));

    // Test staff login redirects to staff dashboard
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    await expect(page).toHaveURL(new RegExp('.*/staff'));
  });

  test('should maintain session persistence', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    // Navigate away and back
    await page.goto(config.webUrl);
    await page.goto('/portal');

    // Should still be logged in
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toContainText(
      config.testUsers.customer.email
    );
  });

  test('should handle logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    // Click logout button
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();

    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), logoutButton.click()]);

    // Should redirect to login page
    await expect(page).toHaveURL(new RegExp('.*/login'));

    // Try to access protected page
    await page.goto('/portal');
    await expect(page).toHaveURL(new RegExp('.*/login'));
  });

  test('should handle loading states during authentication', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    // Check for loading state
    const submitButton = page.locator('[data-testid="login-submit"]');
    await submitButton.click();

    // Should show loading indicator
    await expect(page.locator('[data-testid="login-loading"]')).toBeVisible();

    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Check mobile layout
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();

    // Check that elements are properly sized for touch
    const emailField = page.locator('[data-testid="login-email"]');
    const passwordField = page.locator('[data-testid="login-password"]');
    const submitButton = page.locator('[data-testid="login-submit"]');

    await expect(emailField).toHaveCSS('min-height', /44px|48px/); // Touch-friendly size
    await expect(passwordField).toHaveCSS('min-height', /44px|48px/);
    await expect(submitButton).toHaveCSS('min-height', /44px|48px/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-submit"]')).toBeFocused();

    // Test Enter key submission
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    await page.locator('[data-testid="login-password"]').press('Enter');

    // Should submit form
    await expect(page.locator('[data-testid="login-loading"]')).toBeVisible();
  });

  test('should handle "Remember Me" functionality', async ({ page }) => {
    await page.goto('/login');

    const rememberCheckbox = page.locator('[data-testid="remember-me"]');

    if (await rememberCheckbox.isVisible()) {
      // Test checking remember me
      await rememberCheckbox.check();
      await expect(rememberCheckbox).toBeChecked();

      // Login with remember me checked
      await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
      await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('[data-testid="login-submit"]'),
      ]);

      // Check that session persists longer (would need to test with time manipulation)
      await expect(page).toHaveURL(new RegExp('.*/portal'));
    }
  });
});
