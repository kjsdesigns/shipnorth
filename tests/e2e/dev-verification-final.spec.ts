import { test, expect } from '@playwright/test';

test.describe('Dev Site Final Verification', () => {
  test('should verify staff navigation works correctly', async ({ page }) => {
    test.setTimeout(30000);
    
    // Go to dev site
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/staff/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Should see the staff dashboard layout
    await expect(page.locator('text=Shipnorth')).toBeVisible();
    
    // Check that sidebar navigation is present
    await expect(page.locator('a:has-text("Customers")')).toBeVisible();
    await expect(page.locator('a:has-text("Packages")')).toBeVisible();
    await expect(page.locator('a:has-text("Loads")')).toBeVisible();
    
    // Click on Customers navigation (this was the broken one)
    await page.click('a:has-text("Customers")');
    await page.waitForTimeout(2000);
    
    // Should stay on staff page with tab parameter
    expect(page.url()).toContain('/staff/');
    expect(page.url()).toContain('tab=customers');
    
    console.log('✅ Staff navigation working correctly!');
    console.log('URL after clicking Customers:', page.url());
    
    // Test another navigation item
    await page.click('a:has-text("Packages")');
    await page.waitForTimeout(2000);
    
    expect(page.url()).toContain('tab=packages');
    console.log('✅ Packages navigation working!');
    
    // Test Loads navigation
    await page.click('a:has-text("Loads")');
    await page.waitForTimeout(2000);
    
    expect(page.url()).toContain('tab=loads');
    console.log('✅ Loads navigation working!');
  });

  test('should verify homepage loads correctly', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('h2:has-text("Autonomous Shipping & Billing")')).toBeVisible();
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    
    console.log('✅ Homepage loading correctly!');
  });

  test('should verify login page is accessible', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Login page loading correctly!');
  });

  test('should verify registration page is accessible', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/register/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    
    console.log('✅ Registration page loading correctly!');
  });
});