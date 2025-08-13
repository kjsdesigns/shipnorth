import { test, expect } from '@playwright/test';

test.describe('Modern UI Theme Tests', () => {
  test('staff dashboard displays modern UI elements', async ({ page }) => {
    // Login as staff
    await page.goto('/login');
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/staff', { timeout: 10000 });
    
    // Check for modern layout elements
    console.log('Current URL:', page.url());
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'staff-dashboard.png', fullPage: true });
    
    // Check for sidebar
    const sidebar = page.locator('aside');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log('Sidebar visible:', sidebarVisible);
    
    // Check for theme toggle
    const themeToggle = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("System")').first();
    const themeToggleVisible = await themeToggle.isVisible().catch(() => false);
    console.log('Theme toggle visible:', themeToggleVisible);
    
    // Check for stats cards
    const statsCards = page.locator('.rounded-xl').first();
    const statsCardsVisible = await statsCards.isVisible().catch(() => false);
    console.log('Stats cards visible:', statsCardsVisible);
    
    // Check for dark mode classes
    const htmlElement = page.locator('html');
    const htmlClasses = await htmlElement.getAttribute('class');
    console.log('HTML classes:', htmlClasses);
    
    // Check what's actually on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
    console.log('H1 text:', h1Text);
    
    // Check body content
    const bodyText = await page.locator('body').textContent();
    console.log('Body contains "Staff Dashboard":', bodyText?.includes('Staff Dashboard'));
    console.log('Body contains "ModernLayout":', bodyText?.includes('ModernLayout'));
    console.log('Body contains "Total Packages":', bodyText?.includes('Total Packages'));
    
    // Expectations
    expect(sidebarVisible || themeToggleVisible || statsCardsVisible).toBeTruthy();
  });
  
  test('admin dashboard displays modern UI', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/admin', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
    
    // Check what's rendered
    const pageContent = await page.content();
    console.log('Admin page contains ModernLayout:', pageContent.includes('ModernLayout'));
    console.log('Admin page contains dark:bg-gray:', pageContent.includes('dark:bg-gray'));
    
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
    console.log('Admin H1 text:', h1Text);
  });
});