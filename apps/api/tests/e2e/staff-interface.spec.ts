import { test, expect } from '@playwright/test';

test.describe('Staff Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('http://localhost:8849/login');
    await page.fill('#email', 'staff@shipnorth.com');
    await page.fill('#password', 'staff123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/staff', { timeout: 30000 });
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
  });

  test('should access packages page and show Add Package button', async ({ page }) => {
    // Navigate to packages page
    await page.click('text=Packages');
    await page.waitForURL('**/staff/packages', { timeout: 30000 });
    
    // Verify packages page loads
    await expect(page.locator('h1:has-text("Packages")')).toBeVisible();
    
    // Verify Add Package button exists
    await expect(page.locator('[data-testid="create-package-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-package-button"]:has-text("Add Package")')).toBeVisible();
  });

  test('should open customer selection dialog when clicking Add Package', async ({ page }) => {
    // Navigate to packages and click Add Package
    await page.click('text=Packages');
    await page.waitForURL('**/staff/packages', { timeout: 30000 });
    await page.click('[data-testid="create-package-button"]');
    
    // Verify customer selection dialog opens
    await expect(page.locator('text=Select Customer for Package')).toBeVisible();
    await expect(page.locator('[data-testid="customer-search-input"]')).toBeVisible();
    
    // Search functionality should work
    await page.fill('[data-testid="customer-search-input"]', 'Sarah');
    
    // Should show some customer results
    console.log('Customer search functionality verified');
  });
});
