import { test, expect } from '@playwright/test';

/**
 * Simple Login Test - Direct login without complex helpers
 * Tests the basic login flow to debug authentication issues
 */

test.describe('Simple Login Test', () => {
  test('admin login works end-to-end @simple', async ({ page }) => {
    console.log('🔍 Testing direct admin login...');

    // Step 1: Go to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Shipnorth/);
    console.log('✅ Login page loaded');

    // Step 2: Look for quick login buttons
    const adminButton = page.locator('button:has-text("Admin")');
    await expect(adminButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Admin quick login button found');

    // Step 3: Click admin login and wait
    await adminButton.click();
    console.log('🔄 Clicked admin login button');

    // Step 4: Wait for redirect or error
    try {
      await page.waitForURL(/\/staff/, { timeout: 15000 });
      console.log('✅ Successfully redirected to staff portal');
      
      // Verify staff page loaded
      await expect(page.locator('h1')).toContainText(/Staff Dashboard|Admin Dashboard/);
      console.log('✅ Staff dashboard loaded correctly');
      
    } catch (error) {
      console.log('❌ Login failed, checking page state...');
      
      const currentUrl = page.url();
      const hasError = await page.locator('text=/error|failed|invalid/i').isVisible();
      
      console.log(`Current URL: ${currentUrl}`);
      console.log(`Has error message: ${hasError}`);
      
      if (hasError) {
        const errorText = await page.locator('text=/error|failed|invalid/i').textContent();
        console.log(`Error message: ${errorText}`);
      }

      // Check browser console for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      if (consoleErrors.length > 0) {
        console.log('Browser console errors:', consoleErrors);
      }

      throw error;
    }
  });

  test('test API connection from browser @simple', async ({ page }) => {
    console.log('🔍 Testing API connection from browser...');

    await page.goto('/login');
    
    // Execute API test in browser context
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        return {
          success: true,
          status: response.status,
          data: await response.text()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('API test result:', apiTest);
    expect(apiTest.success).toBe(true);
  });
});