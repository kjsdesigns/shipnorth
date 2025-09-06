import { test, expect } from '@playwright/test';

// Browser-based authentication workflow validation (converted from API-only)
test.describe('🌐 Browser Authentication Workflow Validation', () => {
  
  test('Complete authentication workflow via browser @auth @critical', async ({ page }) => {
    console.log('🔐 Testing complete authentication workflow in browser...');
    
    // Test all user role authentications through browser login
    const users = [
      { email: 'test@test.com', password: 'test123', expectedPortal: '/portal/' },
      { email: 'staff@shipnorth.com', password: 'staff123', expectedPortal: '/staff/' },
      { email: 'admin@shipnorth.com', password: 'admin123', expectedPortal: '/staff/' },
      { email: 'driver@shipnorth.com', password: 'driver123', expectedPortal: '/driver/' }
    ];
    
    for (const user of users) {
      console.log(`\n👤 Testing browser login for ${user.email}...`);
      
      // Navigate to login page
      await page.goto('http://localhost:8849/login');
      await page.waitForLoadState('domcontentloaded');
      
      // Fill login form
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Check redirect to correct portal
      const currentUrl = page.url();
      expect(currentUrl).toContain(user.expectedPortal);
      
      console.log(`✅ ${user.email}: Redirected to ${user.expectedPortal}`);
      
      // Logout for next user
      if (page.url().includes('/staff') || page.url().includes('/driver') || page.url().includes('/portal')) {
        // Look for logout functionality or just go back to login
        await page.goto('http://localhost:8849/login');
        await page.waitForTimeout(1000);
      }
    }
  });
  
  test('Portal accessibility and role-based content @auth @critical', async ({ page }) => {
    console.log('🔄 Testing portal accessibility through browser...');
    
    // Test admin portal access
    console.log('👤 Testing admin portal access...');
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should be on staff portal (admin gets staff portal)
    expect(page.url()).toContain('/staff/');
    
    // Check that admin-specific content is accessible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    console.log('✅ Admin can access staff portal');
    
    // Go back to login for next test
    await page.goto('http://localhost:8849/login');
    await page.waitForTimeout(1000);
  });
  
  test('Role-based navigation and permissions @auth @critical', async ({ page }) => {
    console.log('🛡️ Testing role-based permissions in browser...');
    
    // Login as customer to test restricted access
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should redirect to customer portal
    expect(page.url()).toContain('/portal/');
    
    // Try to access staff portal directly (should be redirected or show error)
    await page.goto('http://localhost:8849/staff/');
    await page.waitForTimeout(2000);
    
    // Should either redirect back to customer portal or show access denied
    const currentUrl = page.url();
    const isProtected = currentUrl.includes('/portal/') || 
                      currentUrl.includes('/login') || 
                      currentUrl.includes('unauthorized');
    
    expect(isProtected).toBe(true);
    console.log('✅ Customer access properly restricted from staff portal');
  });
});