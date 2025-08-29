import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';

/**
 * React Render Error Detection Tests
 * Tests for infinite render loops and other React runtime errors
 */

test.describe('React Runtime Error Detection', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('staff page should not have infinite render errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Login as staff
    await authHelpers.quickLogin('staff');

    // Wait for page to load and render
    await page.waitForTimeout(5000);

    // Check for specific React infinite render error
    const hasInfiniteRenderError = consoleErrors.some(
      (error) =>
        error.includes('Maximum update depth exceeded') ||
        error.includes('Too many re-renders') ||
        error.includes('Cannot update a component while rendering')
    );

    if (hasInfiniteRenderError) {
      console.log('Console errors detected:', consoleErrors);
    }

    expect(hasInfiniteRenderError).toBeFalsy();

    // Verify page still loads correctly despite any errors
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('staff page navigation should not trigger render errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await authHelpers.quickLogin('staff');

    // Navigate through tabs that could trigger re-renders
    const tabs = ['packages', 'customers', 'loads', 'invoices'];

    for (const tab of tabs) {
      const tabSelector = `button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`;
      const tabElement = page.locator(tabSelector).first();

      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(2000); // Allow renders to complete
      }
    }

    const hasRenderErrors = consoleErrors.some(
      (error) =>
        error.includes('Maximum update depth') ||
        error.includes('Too many re-renders') ||
        error.includes('useEffect') ||
        error.includes('Cannot update a component')
    );

    if (hasRenderErrors) {
      console.log('Render errors during navigation:', consoleErrors);
    }

    expect(hasRenderErrors).toBeFalsy();
  });

  test('staff page filters should not cause infinite renders', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await authHelpers.quickLogin('staff');

    // Navigate to packages tab
    const packagesTab = page.locator('button:has-text("Packages")').first();
    if (await packagesTab.isVisible()) {
      await packagesTab.click();
      await page.waitForTimeout(2000);
    }

    // Try changing filters that could trigger re-renders
    const filterSelect = page.locator('select, [data-testid="filter"]').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('in-transit');
      await page.waitForTimeout(2000);

      await filterSelect.selectOption('delivered');
      await page.waitForTimeout(2000);
    }

    const hasFilterRenderErrors = consoleErrors.some(
      (error) => error.includes('Maximum update depth') || error.includes('Too many re-renders')
    );

    if (hasFilterRenderErrors) {
      console.log('Filter render errors:', consoleErrors);
    }

    expect(hasFilterRenderErrors).toBeFalsy();
  });

  test('page refresh should not cause render errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await authHelpers.quickLogin('staff');

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(5000);

    const hasRefreshRenderErrors = consoleErrors.some(
      (error) => error.includes('Maximum update depth') || error.includes('Too many re-renders')
    );

    if (hasRefreshRenderErrors) {
      console.log('Refresh render errors:', consoleErrors);
    }

    expect(hasRefreshRenderErrors).toBeFalsy();

    // Verify page still works after refresh
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
  });
});
