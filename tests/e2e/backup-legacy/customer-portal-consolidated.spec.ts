import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../utils/auth-helpers';
import { CustomerPortal } from '../utils/page-objects';
import { CustomAssertions } from '../utils/assertions';
import { testData, generateTestData } from '../utils/test-data';

/**
 * Comprehensive Customer Portal Tests
 * Consolidates: comprehensive-customer, customer-portal, customer-registration, customer-tracking
 */

test.describe('Customer Portal', () => {
  let authHelpers: AuthHelpers;
  let customerPortal: CustomerPortal;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    customerPortal = new CustomerPortal(page);
    assertions = new CustomAssertions(page);
  });

  test.describe('Customer Authentication and Access', () => {
    test('customer can access portal after login', async ({ page }) => {
      await authHelpers.quickLogin('customer');

      // Verify portal elements
      await expect(customerPortal.welcomeHeading).toBeVisible();
      await expect(customerPortal.customerDashboard).toBeVisible();

      // Check user information is displayed
      if (await customerPortal.userEmail.isVisible()) {
        await expect(customerPortal.userEmail).toContainText('john.doe@example.com');
      }

      await customerPortal.takeScreenshot('customer-portal-dashboard');
    });

    test('customer registration flow works', async ({ page }) => {
      await page.goto('/register');

      // Check if registration page loads
      if (await page.locator('[data-testid="register-form"]').isVisible()) {
        const registerForm = page.locator('[data-testid="register-form"]');
        await expect(registerForm).toBeVisible();

        // Test form validation
        await assertions.expectFormValidation(registerForm, [
          'input[name="email"]',
          'input[name="password"]',
          'input[name="firstName"]',
          'input[name="lastName"]',
        ]);

        // Test successful registration with valid data
        await page.fill('input[name="email"]', generateTestData.email());
        await page.fill('input[name="password"]', testData.validation.validPasswords[0]);
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');

        // Submit registration
        await page.click('button[type="submit"]');

        // Should redirect to portal or show success message
        const currentUrl = page.url();
        const hasSuccess =
          (await page.locator('text=success, text=welcome, text=account created').count()) > 0;

        expect(currentUrl.includes('/portal') || hasSuccess).toBe(true);
      }
    });

    test('customer can logout successfully', async ({ page }) => {
      await authHelpers.quickLogin('customer');

      const loggedOut = await authHelpers.testLogout();

      if (loggedOut) {
        // Should redirect to login page
        await expect(page).toHaveURL('/login');

        // Try to access portal again
        await page.goto('/portal');
        await expect(page).toHaveURL('/login');
      }
    });

    test('session persistence works for customers', async ({ page }) => {
      await authHelpers.testSessionPersistence('customer');
    });
  });

  test.describe('Package Tracking Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await authHelpers.quickLogin('customer');
    });

    test('customer can track packages from portal', async ({ page }) => {
      if (await customerPortal.trackingInput.isVisible()) {
        const trackingNumber = testData.trackingNumbers[0];
        await customerPortal.trackPackage(trackingNumber);

        // Should show tracking results or redirect to tracking page
        await page.waitForTimeout(1000);

        const hasResults =
          (await page.locator('text=tracking, text=status, text=delivered').count()) > 0;
        const isTrackingPage = page.url().includes('/track/');

        expect(hasResults || isTrackingPage).toBe(true);
      }
    });

    test('tracking form validates input', async ({ page }) => {
      if (await customerPortal.trackingInput.isVisible()) {
        // Test empty tracking number
        await customerPortal.trackButton.click();

        // Should show validation error or stay on same page
        const hasValidation =
          (await page.locator('text=required, text=enter tracking').count()) > 0;
        const urlUnchanged = page.url().includes('/portal');

        expect(hasValidation || urlUnchanged).toBe(true);

        // Test invalid tracking number format
        await customerPortal.trackingInput.fill('INVALID');
        await customerPortal.trackButton.click();
        await page.waitForTimeout(1000);

        // Should show "not found" or validation message
        await expect(page.locator('text=not found, text=invalid, text=check')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('tracking shows comprehensive package information', async ({ page }) => {
      if (await customerPortal.trackingInput.isVisible()) {
        // Use a valid test tracking number
        const trackingNumber = testData.trackingNumbers[0];
        await customerPortal.trackPackage(trackingNumber);
        await page.waitForTimeout(2000);

        // Look for common tracking information elements
        const trackingElements = [
          'text=status',
          'text=location',
          'text=estimated delivery',
          'text=tracking history',
          'text=recipient',
        ];

        let visibleElements = 0;
        for (const element of trackingElements) {
          if (await page.locator(element).isVisible()) {
            visibleElements++;
          }
        }

        // At least some tracking information should be visible
        expect(visibleElements).toBeGreaterThan(0);
      }
    });

    test('customer can view tracking history', async ({ page }) => {
      // Navigate to a tracking page directly
      const trackingNumber = testData.trackingNumbers[0];
      await page.goto(`/track/${trackingNumber}`);

      // Should show tracking timeline or history
      const hasHistory =
        (await page
          .locator('text=history, text=timeline, text=updates, .tracking-history')
          .count()) > 0;

      if (hasHistory) {
        // Should have chronological tracking events
        await expect(page.locator('text=shipped, text=in transit, text=delivered')).toBeVisible();

        // Should have timestamps
        await expect(
          page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}-\\d{2}/')
        ).toBeVisible();
      }
    });
  });

  test.describe('Customer Package Management', () => {
    test.beforeEach(async ({ page }) => {
      await authHelpers.quickLogin('customer');
    });

    test('customer can view their package list', async ({ page }) => {
      if (await customerPortal.packagesList.isVisible()) {
        await expect(customerPortal.packagesList).toBeVisible();

        // Should show packages or empty state
        const hasPackages = (await page.locator('text=/PKG-|1Z|CP/').count()) > 0;
        const hasEmptyState =
          (await page.locator('text=no packages, text=no shipments').count()) > 0;

        expect(hasPackages || hasEmptyState).toBe(true);
      }
    });

    test('package list shows relevant information', async ({ page }) => {
      const packageElements = page.locator(
        '[data-testid="package-item"], .package-card, .shipment-item'
      );

      if ((await packageElements.count()) > 0) {
        const firstPackage = packageElements.first();

        // Should show essential package information
        const hasTrackingNumber = (await firstPackage.locator('text=/PKG-|1Z|CP/').count()) > 0;
        const hasStatus =
          (await firstPackage.locator('text=status, text=delivered, text=transit').count()) > 0;
        const hasDate =
          (await firstPackage.locator('text=/\\d{1,2}\\/\\d{1,2}|\\d{4}-\\d{2}-\\d{2}/').count()) >
          0;

        expect(hasTrackingNumber || hasStatus || hasDate).toBe(true);
      }
    });

    test('customer can filter/sort packages', async ({ page }) => {
      const filterControls = page.locator(
        'select[name="status"], select[name="sort"], .filter-dropdown'
      );

      if ((await filterControls.count()) > 0) {
        const firstFilter = filterControls.first();
        await firstFilter.click();

        // Should show filter options
        await expect(page.locator('option, [role="option"]')).toBeVisible();

        // Select a filter option
        if (await page.locator('option[value="delivered"]').isVisible()) {
          await firstFilter.selectOption('delivered');
          await page.waitForTimeout(1000);

          // Package list should update (or show no results)
          await expect(page.locator('text=delivered, text=no packages')).toBeVisible();
        }
      }
    });

    test('customer can view package details', async ({ page }) => {
      const packageLinks = page.locator(
        'a[href*="/track/"], button:has-text("View Details"), .package-link'
      );

      if ((await packageLinks.count()) > 0) {
        await packageLinks.first().click();
        await page.waitForTimeout(1000);

        // Should navigate to package details or show modal
        const isDetailsPage = page.url().includes('/track/');
        const hasModal = (await page.locator('[role="dialog"], .modal').count()) > 0;

        expect(isDetailsPage || hasModal).toBe(true);
      }
    });
  });

  test.describe('Mobile and Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await authHelpers.quickLogin('customer');
    });

    test('customer portal works on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForTimeout(1000);

      // Main elements should be visible and usable on mobile
      await expect(customerPortal.welcomeHeading).toBeVisible();

      // Tracking form should be mobile-friendly
      if (await customerPortal.trackingInput.isVisible()) {
        await expect(customerPortal.trackingInput).toHaveCSS('min-height', /44px|48px/);
        await expect(customerPortal.trackButton).toHaveCSS('min-height', /44px|48px/);
      }

      // Package list should be scrollable on mobile
      if (await customerPortal.packagesList.isVisible()) {
        await expect(customerPortal.packagesList).toBeVisible();
      }

      await customerPortal.takeScreenshot('customer-mobile-portal');
    });

    test('customer portal works on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForTimeout(1000);

      // Should have optimized layout for tablet
      await expect(customerPortal.welcomeHeading).toBeVisible();

      // Elements should be properly spaced
      if (await customerPortal.trackingInput.isVisible()) {
        const trackingSection = customerPortal.trackingInput.locator('..');
        await expect(trackingSection).toBeVisible();
      }

      await customerPortal.takeScreenshot('customer-tablet-portal');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await authHelpers.quickLogin('customer');
    });

    test('handles invalid tracking numbers gracefully', async ({ page }) => {
      if (await customerPortal.trackingInput.isVisible()) {
        const invalidNumbers = ['INVALID123', '000000000', 'TEST-ERROR'];

        for (const invalidNumber of invalidNumbers) {
          await customerPortal.trackingInput.fill(invalidNumber);
          await customerPortal.trackButton.click();
          await page.waitForTimeout(1000);

          // Should show appropriate error message
          await expect(page.locator('text=not found, text=invalid, text=error')).toBeVisible({
            timeout: 3000,
          });

          // Clear for next test
          await customerPortal.trackingInput.fill('');
        }
      }
    });

    test('handles API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/packages/**', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Package not found' }),
        });
      });

      if (await customerPortal.trackingInput.isVisible()) {
        await customerPortal.trackPackage(testData.trackingNumbers[0]);

        // Should show user-friendly error message
        await expect(page.locator('text=not found, text=try again, [role="alert"]')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('handles network connectivity issues', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', (route) => {
        route.abort('internetdisconnected');
      });

      if (await customerPortal.trackingInput.isVisible()) {
        await customerPortal.trackPackage(testData.trackingNumbers[0]);

        // Should show network error message
        await expect(page.locator('text=connection, text=network, text=offline')).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe('Performance', () => {
    test('portal loads quickly for customers', async ({ page }) => {
      await assertions.expectPerformance(async () => {
        await authHelpers.quickLogin('customer');
      }, 8000);
    });

    test('package tracking is responsive', async ({ page }) => {
      await authHelpers.quickLogin('customer');

      if (await customerPortal.trackingInput.isVisible()) {
        await assertions.expectPerformance(async () => {
          await customerPortal.trackPackage(testData.trackingNumbers[0]);
        }, 5000);
      }
    });
  });
});
