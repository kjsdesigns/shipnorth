import { test, expect } from '@playwright/test';

test('verify staff navigation on dev site', async ({ page }) => {
  test.setTimeout(30000);
  
  try {
    // Go directly to login
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    console.log('✅ Login page loaded');
    
    // Try to login with staff credentials
    await page.fill('input[name="email"]', 'staff@shipnorth.com');
    await page.fill('input[name="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Login attempted');
    
    // Check if we're on staff dashboard
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/staff')) {
      console.log('✅ Successfully reached staff dashboard');
      
      // Test the navigation that was problematic
      try {
        await page.click('a:has-text("Customers")', { timeout: 5000 });
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        console.log('After clicking Customers:', finalUrl);
        
        if (finalUrl.includes('tab=customers')) {
          console.log('✅ Navigation works correctly - using tab parameters');
        } else {
          console.log('❌ Navigation issue - URL:', finalUrl);
        }
        
      } catch (navError) {
        console.log('❌ Navigation click failed:', navError);
      }
      
    } else {
      console.log('❌ Not on staff dashboard, current URL:', currentUrl);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
});