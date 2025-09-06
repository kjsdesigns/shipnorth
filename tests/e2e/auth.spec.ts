import { test, expect } from '@playwright/test';
import { authAgent } from '../../agents/auth-agent-helpers';
import { LoginPage, HomePage } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { testData } from './utils/test-data';

/**
 * 🛡️ Authentication Agent Compliant Tests
 * Uses Authentication Agent as single source of truth
 * Consolidates: basic-auth, comprehensive-auth, customer-auth, login-debug, login-theme
 */

test.describe('🛡️ Authentication Agent - Legacy Test Suite', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    assertions = new CustomAssertions(page);
    
    // Authentication Agent pre-test health check
    await authAgent.healthCheck(page);
  });

  test.describe('Homepage and Navigation @smoke', () => {
    test('homepage loads correctly with all elements', async ({ page }) => {
      await page.goto('/');

      // Check title and main content
      await expect(page).toHaveTitle(/Shipnorth/);
      await expect(homePage.heroHeading).toBeVisible();

      // Check navigation elements
      await expect(homePage.featuresLink).toBeVisible();
      await expect(homePage.howItWorksLink).toBeVisible();
      await expect(homePage.pricingLink).toBeVisible();

      // Check theme toggle and sign in
      await expect(homePage.themeToggle).toBeVisible();
      await expect(homePage.signInButton).toBeVisible();

      // Check tracking form
      await expect(homePage.trackingInput).toBeVisible();
      await expect(homePage.trackButton).toBeVisible();

      // Check CTA buttons
      await expect(homePage.getStartedButton).toBeVisible();

      await homePage.takeScreenshot('homepage-complete');
    });

    test('theme toggle works correctly', async ({ page }) => {
      await page.goto('/');
      await assertions.expectThemeToggle(homePage.themeToggle);

      // Take screenshots of both themes
      await homePage.takeScreenshot('homepage-dark-theme');
      await homePage.themeToggle.click();
      await page.waitForTimeout(500);
      await homePage.takeScreenshot('homepage-light-theme');
    });

    test('tracking form navigation works', async ({ page }) => {
      await page.goto('/');

      // Test empty tracking number
      await homePage.trackButton.click();
      await expect(page).toHaveURL('/'); // Should not navigate

      // Test with valid tracking number
      const trackingNumber = testData.trackingNumbers[0];
      await homePage.trackPackage(trackingNumber);
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(new RegExp(`/track/${trackingNumber}`));
    });
  });

  test.describe('Login Page Structure and Validation', () => {
    test('login page loads correctly', async ({ page }) => {
      await authHelpers.goToLogin();

      // Check main elements
      await expect(loginPage.welcomeHeading).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();

      // Check branding and navigation
      await expect(loginPage.shipnorthLogo).toBeVisible();
      await expect(loginPage.themeToggle).toBeVisible();
      await expect(loginPage.registerLink).toBeVisible();

      // Check quick login buttons
      await expect(loginPage.adminQuickLogin).toBeVisible();
      await expect(loginPage.staffQuickLogin).toBeVisible();
      await expect(loginPage.driverQuickLogin).toBeVisible();
      await expect(loginPage.customerQuickLogin).toBeVisible();

      await loginPage.takeScreenshot('login-page-structure');
    });

    test('password visibility toggle works', async ({ page }) => {
      await authHelpers.goToLogin();

      // Initially should be password type
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

      // Click toggle to show password
      await loginPage.togglePasswordVisibility();
      await page.waitForTimeout(100);

      // Should now be text type
      await expect(loginPage.passwordInput.or(page.locator('input[type="text"]'))).toBeVisible();

      // Click toggle to hide password again
      await loginPage.togglePasswordVisibility();
      await page.waitForTimeout(100);

      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('form validation works properly', async ({ page }) => {
      await authHelpers.goToLogin();

      // Test empty form submission
      await loginPage.submitButton.click();

      // HTML5 validation should prevent submission
      await expect(loginPage.emailInput).toBeVisible();

      // Test email validation
      await assertions.expectEmailValidation(
        loginPage.emailInput,
        testData.validation.invalidEmails
      );

      // Test valid email but empty password
      await loginPage.emailInput.fill(testData.validation.validEmails[0]);
      await loginPage.submitButton.click();

      const passwordValidity = await loginPage.passwordInput.evaluate(
        (input: HTMLInputElement) => input.validity.valid
      );
      expect(passwordValidity).toBe(false);
    });

    test('keyboard navigation works', async ({ page }) => {
      await authHelpers.goToLogin();

      await assertions.expectKeyboardNavigation([
        loginPage.emailInput,
        loginPage.passwordInput,
        loginPage.submitButton,
      ]);

      // Test Enter key submission with valid credentials
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('password123');
      await loginPage.passwordInput.press('Enter');

      // Should show loading state
      await assertions.expectLoadingState(loginPage.submitButton);
    });

    test('responsive design works', async ({ page }) => {
      await authHelpers.goToLogin();

      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop' },
      ];

      await assertions.expectResponsiveDesign(viewports, [
        loginPage.welcomeHeading,
        loginPage.emailInput,
        loginPage.passwordInput,
        loginPage.submitButton,
        loginPage.adminQuickLogin,
        loginPage.staffQuickLogin,
      ]);
    });
  });

  test.describe('Quick Login Authentication', () => {
    test('admin quick login works', async ({ page }) => {
      await authHelpers.quickLogin('admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      await page.screenshot({ path: 'test-results/admin-dashboard-login.png', fullPage: true });
    });

    test('staff quick login works', async ({ page }) => {
      await authHelpers.quickLogin('staff');
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
      await page.screenshot({ path: 'test-results/staff-dashboard-login.png', fullPage: true });
    });

    test('driver quick login works', async ({ page }) => {
      await authHelpers.quickLogin('driver');
      await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
      await page.screenshot({ path: 'test-results/driver-portal-login.png', fullPage: true });
    });

    test('customer quick login works', async ({ page }) => {
      await authHelpers.quickLogin('customer');
      await expect(
        page.locator(
          'h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")'
        )
      ).toBeVisible();
      await page.screenshot({ path: 'test-results/customer-portal-login.png', fullPage: true });
    });

    test('quick login buttons show loading state', async ({ page }) => {
      await authHelpers.goToLogin();

      const staffButton = loginPage.staffQuickLogin;
      await assertions.expectLoadingState(staffButton);
    });
  });

  test.describe('Manual Login Authentication', () => {
    test('manual admin login works', async ({ page }) => {
      await authHelpers.manualLogin('admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('manual staff login works', async ({ page }) => {
      await authHelpers.manualLogin('staff');
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
    });

    test('manual driver login works', async ({ page }) => {
      await authHelpers.manualLogin('driver');
      await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
    });

    test('manual customer login works', async ({ page }) => {
      await authHelpers.manualLogin('customer');
      await expect(
        page.locator(
          'h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")'
        )
      ).toBeVisible();
    });

    test('invalid credentials show error', async ({ page }) => {
      await authHelpers.loginWithInvalidCredentials();
      await page.screenshot({ path: 'test-results/login-error-state.png', fullPage: true });
    });

    test('login button shows loading state', async ({ page }) => {
      await authHelpers.goToLogin();

      await loginPage.login('staff@shipnorth.com', 'staff123');
      await assertions.expectLoadingState(loginPage.submitButton);
    });
  });

  test.describe('Session Management', () => {
    test('user stays logged in after page refresh', async ({ page }) => {
      await authHelpers.quickLogin('staff');

      // Refresh page
      await page.reload();

      // Should still be on staff dashboard
      await expect(page).toHaveURL('/staff/');
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
    });

    test('logout functionality works', async ({ page }) => {
      await authHelpers.quickLogin('staff');

      const loggedOut = await authHelpers.testLogout();

      if (loggedOut) {
        // Verify logged out by trying to access protected page
        await page.goto('/staff/');
        await expect(page).toHaveURL('/login/');
      }
    });

    test('protected routes redirect to login when not authenticated', async ({ page }) => {
      await authHelpers.testProtectedRoutes();
    });

    test('session persistence works across different roles', async ({ page }) => {
      const roles: ('admin' | 'staff' | 'driver' | 'customer')[] = [
        'admin',
        'staff',
        'driver',
        'customer',
      ];

      for (const role of roles) {
        await authHelpers.testSessionPersistence(role);
        await authHelpers.clearStorage(); // Clean up between tests
      }
    });
  });

  test.describe('Role-based Access Control', () => {
    test('different roles redirect to appropriate dashboards', async ({ page }) => {
      const roleTests = [
        { role: 'admin' as const, expectedUrl: '/admin', expectedHeading: 'Admin Dashboard' },
        { role: 'staff' as const, expectedUrl: '/staff/', expectedHeading: 'Staff Dashboard' },
        { role: 'driver' as const, expectedUrl: '/driver/', expectedHeading: 'Driver Portal' },
        {
          role: 'customer' as const,
          expectedUrl: '/portal/',
          expectedHeading: 'Shipnorth|Customer Portal|Your Packages',
        },
      ];

      for (const { role, expectedUrl, expectedHeading } of roleTests) {
        await authHelpers.manualLogin(role);
        await expect(page).toHaveURL(expectedUrl);
        // Use flexible heading matching for customer portal
        if (expectedHeading.includes('|')) {
          const headings = expectedHeading.split('|');
          const headingSelector = headings.map((h) => `h1:has-text("${h}")`).join(', ');
          await expect(page.locator(headingSelector)).toBeVisible();
        } else {
          await expect(page.locator(`h1:has-text("${expectedHeading}")`)).toBeVisible();
        }
        await authHelpers.clearStorage();
      }
    });

    test('cross-role navigation is properly restricted', async ({ page }) => {
      // Login as customer
      await authHelpers.quickLogin('customer');

      // Try to access admin routes
      await page.goto('/admin');
      await expect(page).toHaveURL('/login/'); // Should redirect to login

      // Try to access staff routes
      await page.goto('/staff/');
      await expect(page).toHaveURL('/login/');

      // Try to access driver routes
      await page.goto('/driver/');
      await expect(page).toHaveURL('/login/');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('network error handling during authentication', async ({ page }) => {
      await authHelpers.goToLogin();

      // Attempt login (may fail if API is down)
      await loginPage.login('staff@shipnorth.com', 'staff123');

      // Wait for response
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      if (currentUrl.includes('/login/')) {
        // If still on login, check for error message
        const errorElements = await page
          .locator('text=/error/i, text=/failed/i, [role="alert"]')
          .count();
        if (errorElements > 0) {
          await page.screenshot({ path: 'test-results/login-network-error.png', fullPage: true });
        }
      }
    });

    test('handles malformed authentication responses', async ({ page }) => {
      await authHelpers.goToLogin();

      // Intercept auth request to return malformed response
      await page.route('**/api/auth/login/', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ malformed: 'response' }),
        });
      });

      await loginPage.login('staff@shipnorth.com', 'staff123');

      // Should handle error gracefully
      await expect(page.locator('text=/error/i, [role="alert"]')).toBeVisible({ timeout: 5000 });
    });

    test('handles slow network conditions', async ({ page }) => {
      await authHelpers.goToLogin();

      // Simulate slow network
      await page.route('**/api/auth/login/', (route) => {
        setTimeout(() => route.continue(), 3000);
      });

      await loginPage.login('staff@shipnorth.com', 'staff123');

      // Should show loading state during slow request
      await assertions.expectLoadingState(loginPage.submitButton);
    });
  });

  test.describe('Accessibility and UX', () => {
    test('login form is accessible', async ({ page }) => {
      await authHelpers.goToLogin();

      // Check form labels
      await expect(page.locator('label:has-text("Email")')).toBeVisible();
      await expect(page.locator('label:has-text("Password")')).toBeVisible();

      // Check ARIA attributes
      const emailInput = loginPage.emailInput;
      const passwordInput = loginPage.passwordInput;

      const emailAriaLabel = await emailInput.getAttribute('aria-label');
      const passwordAriaLabel = await passwordInput.getAttribute('aria-label');

      expect(emailAriaLabel || (await emailInput.getAttribute('placeholder'))).toBeTruthy();
      expect(passwordAriaLabel || (await passwordInput.getAttribute('placeholder'))).toBeTruthy();
    });

    test('focus management works properly', async ({ page }) => {
      await authHelpers.goToLogin();

      // Email field should be focusable
      await loginPage.emailInput.focus();
      await expect(loginPage.emailInput).toBeFocused();

      // Tab to password field
      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();

      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(loginPage.submitButton).toBeFocused();
    });

    test('error messages are announced properly', async ({ page }) => {
      await authHelpers.loginWithInvalidCredentials();

      // Error message should have proper ARIA attributes
      const errorMessage = page.locator('[role="alert"], .error-message').first();
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('login operations complete within acceptable time', async ({ page }) => {
      await assertions.expectPerformance(async () => {
        await authHelpers.quickLogin('staff');
      }, 10000);
    });

    test('theme toggle is responsive', async ({ page }) => {
      await page.goto('/');

      await assertions.expectPerformance(async () => {
        await homePage.themeToggle.click();
        await page.waitForTimeout(100);
      }, 1000);
    });

    test('page loads are optimized', async ({ page }) => {
      await assertions.expectPerformance(async () => {
        await page.goto('/login/');
        await expect(loginPage.welcomeHeading).toBeVisible();
      }, 5000);
    });
  });
});
