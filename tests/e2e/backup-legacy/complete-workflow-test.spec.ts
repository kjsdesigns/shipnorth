import { test, expect } from '@playwright/test';

test.describe('Complete Shipnorth Workflow Tests', () => {
  test('Staff workflow: login → customers → packages → loads', async ({ page }) => {
    // Staff Login
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForURL('**/staff**');
    await expect(page.locator('h1')).toContainText('Staff Dashboard');

    // Test Customers section
    await page.click('a:has-text("Customers")');
    await page.waitForURL('**/staff/customers');
    await expect(page.locator('h1')).toContainText('Customers');

    // Test customer search
    await page.fill('input[placeholder*="Search customers"]', 'jane');
    await page.waitForTimeout(500);
    await expect(page.locator('td:has-text("Jane Smith")')).toBeVisible();

    // Test Add Customer
    await page.click('button:has-text("Add Customer")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');

    // Test Packages section
    await page.click('a:has-text("Packages")');
    await page.waitForURL('**/staff/packages');
    await expect(page.locator('h1')).toContainText('Packages');

    // Test package search
    await page.fill('input[placeholder*="Search packages"]', '1Z999');
    await page.waitForTimeout(500);
    await expect(page.locator('td:has-text("1Z999AA10123456784")')).toBeVisible();

    // Test Loads section
    await page.click('a:has-text("Loads")');
    await page.waitForURL('**/staff/loads');
    await expect(page.locator('h1')).toContainText('Loads');

    console.log('✅ Staff workflow test completed');
  });

  test('Customer workflow: login → tracking → package details', async ({ page }) => {
    // Customer Login
    await page.goto('http://localhost:3001/portal/login');
    await page.click('button:has-text("Customer")');
    await page.waitForURL('**/portal**');
    await expect(page.locator('h1')).toContainText('My Packages');

    // Test package search
    await page.fill('input[placeholder*="Search by tracking"]', 'CP123');
    await page.waitForTimeout(500);

    // Test package details
    const packageCard = page.locator('.bg-white').first();
    if (await packageCard.isVisible()) {
      await packageCard.click();
      await page.waitForTimeout(1000);
    }

    console.log('✅ Customer workflow test completed');
  });

  test('Driver workflow: login → manifest → delivery', async ({ page }) => {
    // Driver Login
    await page.goto('http://localhost:3001/driver/login');
    await page.click('button:has-text("Driver")');
    await page.waitForURL('**/driver**');
    await expect(page.locator('h1')).toContainText('Driver Dashboard');

    // Test package scanning
    const scanButton = page.locator('button:has-text("Scan Package")');
    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Cancel")');
    }

    console.log('✅ Driver workflow test completed');
  });

  test('Admin workflow: login → user management', async ({ page }) => {
    // Admin Login
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Admin")');
    await page.waitForURL('**/admin**');

    // Navigate to user management
    await page.goto('http://localhost:3001/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');

    // Test user creation
    await page.click('button:has-text("Add User")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancel")');

    console.log('✅ Admin workflow test completed');
  });

  test('Documentation site functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/docs');
    await expect(page.locator('h1')).toContainText('Documentation');

    // Test API docs
    await page.click('a:has-text("API Documentation")');
    await page.waitForURL('**/docs/api');

    // Test business docs
    await page.goto('http://localhost:3001/docs/business');
    await expect(page.locator('h1')).toContainText('Business');

    console.log('✅ Documentation test completed');
  });

  test('Global search functionality', async ({ page }) => {
    // Login as staff first
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForURL('**/staff**');

    // Test global search
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Type search query
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('john');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Global search test completed');
  });
});
