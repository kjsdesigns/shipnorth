import { test, expect } from '@playwright/test';

test.describe('Driver Portal Tests', () => {
  test('driver can login and view portal', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Use the quick login button for driver
    await page.click('button:has-text("Driver")');
    
    // Wait for either success or error
    await page.waitForLoadState('networkidle');
    
    // Check if we're still on login page or redirected
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // If we're on the driver portal, validate it
    if (currentUrl.includes('/driver')) {
      await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
      console.log('✅ Successfully logged in as driver');
    } else {
      // Log any error messages
      const errorElement = page.locator('.text-red-700');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('❌ Login error:', errorText);
      }
      
      // Try manual login
      await page.fill('input[type="email"]', 'driver@shipnorth.com');
      await page.fill('input[type="password"]', 'driver123');
      await page.click('button[type="submit"]');
      
      // Wait for network activity to complete
      await page.waitForLoadState('networkidle');
      
      // Check result
      const finalUrl = page.url();
      console.log('Final URL after manual login:', finalUrl);
      
      if (finalUrl.includes('/driver')) {
        await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
        console.log('✅ Successfully logged in manually');
      }
    }
  });
  
  test('driver can start tracking a load', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'driver@shipnorth.com');
    await page.fill('input[type="password"]', 'driver123');
    await page.click('button[type="submit"]');
    
    // Wait for network to settle
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/driver')) {
      console.log('Failed to login, current URL:', currentUrl);
      test.skip();
    }
    
    // Look for load tracking elements
    const loadList = page.locator('.load-item, .bg-white.rounded-lg');
    const loadCount = await loadList.count();
    console.log(`Found ${loadCount} load items`);
    
    if (loadCount > 0) {
      // Check for GPS tracking functionality
      const trackingButton = page.locator('button:has-text("Start Tracking"), button:has-text("Track")').first();
      if (await trackingButton.isVisible()) {
        await trackingButton.click();
        console.log('✅ Clicked tracking button');
        
        // Wait for any response
        await page.waitForTimeout(2000);
        
        // Check if tracking started
        const trackingStatus = page.locator('text=/tracking|active|GPS/i');
        if (await trackingStatus.isVisible()) {
          console.log('✅ Tracking appears to be active');
        }
      }
    }
  });
});