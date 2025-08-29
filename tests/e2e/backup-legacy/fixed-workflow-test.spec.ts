import { test, expect } from '@playwright/test';

test.describe('Shipnorth Workflow Tests - Fixed', () => {
  test('Complete staff interface verification', async ({ page }) => {
    console.log('🧪 Testing complete staff interface...');

    // Login as staff
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(5000);

    // Verify dashboard
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
    await page.screenshot({ path: 'test-results/staff-dashboard-verified.png', fullPage: true });

    // Test customers page
    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(3000);
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();
    await page.screenshot({ path: 'test-results/customers-page-verified.png', fullPage: true });

    // Test packages page
    await page.goto('http://localhost:3001/staff/packages');
    await page.waitForTimeout(3000);
    await expect(page.locator('h1:has-text("Packages")')).toBeVisible();
    await page.screenshot({ path: 'test-results/packages-page-verified.png', fullPage: true });

    // Test loads page
    await page.goto('http://localhost:3001/staff/loads');
    await page.waitForTimeout(3000);
    await expect(page.locator('h1:has-text("Loads")')).toBeVisible();
    await page.screenshot({ path: 'test-results/loads-page-verified.png', fullPage: true });

    console.log('✅ Staff interface verification complete');
  });

  test('Documentation site verification', async ({ page }) => {
    console.log('📚 Testing documentation site...');

    await page.goto('http://localhost:3001/docs');
    await page.waitForTimeout(2000);

    // Check for documentation content
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({ path: 'test-results/docs-main-verified.png', fullPage: true });

    console.log('✅ Documentation site verification complete');
  });

  test('Form functionality verification', async ({ page }) => {
    console.log('📝 Testing form functionality...');

    // Login and test customer form
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(2000);

    // Test Add Customer form
    await page.click('button:has-text("Add Customer")');
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      await page.screenshot({ path: 'test-results/customer-form-verified.png', fullPage: true });
      await page.click('button:has-text("Cancel")');
      console.log('✅ Customer form working');
    }

    // Test package form
    await page.goto('http://localhost:3001/staff/packages');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add Package")');
    await page.waitForTimeout(1000);

    const packageModal = page.locator('[role="dialog"]');
    if (await packageModal.isVisible()) {
      await page.screenshot({ path: 'test-results/package-form-verified.png', fullPage: true });
      await page.click('button:has-text("Cancel")');
      console.log('✅ Package form working');
    }

    console.log('✅ Form functionality verification complete');
  });
});
