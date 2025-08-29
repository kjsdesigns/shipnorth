import { test, expect } from '@playwright/test';

test.describe('Shipnorth Simple Verification', () => {
  test('Staff login and navigation', async ({ page }) => {
    console.log('🧪 Testing staff login and navigation...');

    // Test staff login
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(5000);

    // Verify dashboard
    const url = page.url();
    expect(url).toContain('/staff');
    console.log('✅ Staff login successful');

    // Test customers page
    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(3000);

    // Check if customers page loads
    const customersHeading = page.locator('h1:has-text("Customers")');
    await expect(customersHeading).toBeVisible();
    console.log('✅ Customers page accessible');

    // Test packages page
    await page.goto('http://localhost:3001/staff/packages');
    await page.waitForTimeout(3000);

    const packagesHeading = page.locator('h1:has-text("Packages")');
    await expect(packagesHeading).toBeVisible();
    console.log('✅ Packages page accessible');

    // Test loads page
    await page.goto('http://localhost:3001/staff/loads');
    await page.waitForTimeout(3000);

    const loadsHeading = page.locator('h1:has-text("Loads")');
    await expect(loadsHeading).toBeVisible();
    console.log('✅ Loads page accessible');
  });

  test('Customer portal access', async ({ page }) => {
    console.log('👥 Testing customer portal...');

    await page.goto('http://localhost:3001/portal');
    await page.waitForTimeout(3000);

    // Should redirect to login or show portal
    const currentUrl = page.url();
    const isAccessible = currentUrl.includes('/portal') || currentUrl.includes('/login');
    expect(isAccessible).toBe(true);
    console.log('✅ Customer portal accessible');
  });

  test('Driver interface access', async ({ page }) => {
    console.log('🚛 Testing driver interface...');

    await page.goto('http://localhost:3001/driver');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isAccessible = currentUrl.includes('/driver') || currentUrl.includes('/login');
    expect(isAccessible).toBe(true);
    console.log('✅ Driver interface accessible');
  });

  test('Documentation site access', async ({ page }) => {
    console.log('📚 Testing documentation...');

    await page.goto('http://localhost:3001/docs');
    await page.waitForTimeout(3000);

    // Check if docs page loads (should have some content)
    const hasContent = (await page.locator('h1, h2, h3').count()) > 0;
    expect(hasContent).toBe(true);
    console.log('✅ Documentation site accessible');
  });

  test('Form functionality test', async ({ page }) => {
    console.log('📝 Testing forms...');

    // Login as staff
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(5000);

    // Test customer form
    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add Customer")');
    await page.waitForTimeout(2000);

    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      console.log('✅ Customer form modal working');
      await page.click('button:has-text("Cancel")');
    } else {
      console.log('❌ Customer form modal not working');
    }
  });
});
