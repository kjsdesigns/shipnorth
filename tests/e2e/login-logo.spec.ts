import { test, expect } from '@playwright/test';

test.describe('Login Logo Tests', () => {
  test('login page logo links to homepage', async ({ page }) => {
    await page.goto('/login');
    
    // Take screenshot to verify logo is visible and styled correctly
    await page.screenshot({ path: 'login-logo-test.png', fullPage: false });
    
    // Check that the logo link exists
    const logoLink = page.locator('a[href="/"]');
    await expect(logoLink).toBeVisible();
    
    // Check that it contains the Package icon and Shipnorth text
    const packageIcon = logoLink.locator('svg'); // Package icon
    const shipnorthText = logoLink.locator('h1:has-text("Shipnorth")');
    
    await expect(packageIcon).toBeVisible();
    await expect(shipnorthText).toBeVisible();
    
    // Test clicking the logo navigates to homepage
    await logoLink.click();
    
    // Wait for navigation to homepage
    await page.waitForURL('/', { timeout: 5000 });
    
    // Verify we're on the homepage
    expect(page.url()).toContain('/');
    await expect(page.locator('h2:has-text("Autonomous Shipping")')).toBeVisible();
    
    console.log('Logo click test passed - navigated to homepage successfully');
  });
  
  test('login logo has hover effects', async ({ page }) => {
    await page.goto('/login');
    
    const logoLink = page.locator('a[href="/"]');
    
    // Check initial state
    await expect(logoLink).toHaveClass(/group/);
    await expect(logoLink).toHaveClass(/transition-transform/);
    await expect(logoLink).toHaveClass(/hover:scale-105/);
    
    // Test hover state (this checks the CSS classes are present)
    const iconContainer = logoLink.locator('div').first();
    await expect(iconContainer).toHaveClass(/group-hover:bg-blue-200/);
    
    console.log('Logo hover effects verified');
  });
});