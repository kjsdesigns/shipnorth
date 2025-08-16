import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Debug', () => {
  test('check admin dashboard content and formatting', async ({ page }) => {
    // Enable console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('/login');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin', { timeout: 10000 });
    
    console.log('Current URL:', page.url());
    
    // Take full page screenshot
    await page.screenshot({ path: 'admin-dashboard-debug.png', fullPage: true });
    
    // Check if main content is visible
    const mainContent = page.locator('main');
    const mainVisible = await mainContent.isVisible().catch(() => false);
    console.log('Main content visible:', mainVisible);
    
    // Check for dashboard title
    const dashboardTitle = page.locator('h1:has-text("Admin Dashboard")');
    const titleVisible = await dashboardTitle.isVisible().catch(() => false);
    console.log('Dashboard title visible:', titleVisible);
    
    // Check for stats cards
    const statsCards = page.locator('[class*="grid"]').first();
    const cardsVisible = await statsCards.isVisible().catch(() => false);
    console.log('Stats cards container visible:', cardsVisible);
    
    // Count total elements
    const allElements = await page.locator('*').count();
    console.log('Total elements on page:', allElements);
    
    // Check for any error states
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log('Error elements found:', errorElements);
    
    // Check specific content elements
    const revenueCard = page.locator('text=/Total Revenue/i');
    const revenueVisible = await revenueCard.isVisible().catch(() => false);
    console.log('Revenue card visible:', revenueVisible);
    
    // Check page content
    const bodyContent = await page.locator('body').textContent();
    console.log('Page contains "Total Revenue":', bodyContent?.includes('Total Revenue') || false);
    console.log('Page contains "Active Customers":', bodyContent?.includes('Active Customers') || false);
  });
});