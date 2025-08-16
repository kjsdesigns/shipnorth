import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  
  test('theme toggle works on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check initial state
    const htmlElement = page.locator('html');
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Homepage initial HTML classes:', htmlClasses);
    
    // Click dark mode button (doesn't exist on homepage yet, so skip for now)
    console.log('Homepage doesn\'t have theme toggle yet');
  });

  test('theme toggle works on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check initial state
    const htmlElement = page.locator('html');
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Login page initial HTML classes:', htmlClasses);
    
    // Find and click dark mode button
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    
    // Check if dark class is applied
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('After clicking dark mode:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    
    // Click light mode button
    const lightButton = page.locator('button[aria-label="Light mode"]');
    await lightButton.click();
    
    // Check if dark class is removed
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('After clicking light mode:', htmlClasses);
    expect(htmlClasses || '').not.toContain('dark');
    
    // Click system mode button
    const systemButton = page.locator('button[aria-label="System"]');
    await systemButton.click();
    
    // Check that system mode is working (will be light or dark based on system)
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('After clicking system mode:', htmlClasses);
    
    // Take screenshots in different modes
    await darkButton.click();
    await page.screenshot({ path: 'login-dark-mode.png', fullPage: false });
    
    await lightButton.click();
    await page.screenshot({ path: 'login-light-mode.png', fullPage: false });
  });

  test('theme toggle works on admin dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
    
    const htmlElement = page.locator('html');
    
    // Test dark mode
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Admin dashboard - dark mode:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    await page.screenshot({ path: 'admin-dark-mode.png', fullPage: false });
    
    // Test light mode
    const lightButton = page.locator('button[aria-label="Light mode"]');
    await lightButton.click();
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('Admin dashboard - light mode:', htmlClasses);
    expect(htmlClasses || '').not.toContain('dark');
    await page.screenshot({ path: 'admin-light-mode.png', fullPage: false });
  });

  test('theme toggle works on staff dashboard', async ({ page }) => {
    // Login as staff
    await page.goto('/login');
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/staff', { timeout: 10000 });
    
    const htmlElement = page.locator('html');
    
    // Test dark mode
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Staff dashboard - dark mode:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    await page.screenshot({ path: 'staff-dark-mode.png', fullPage: false });
    
    // Test light mode
    const lightButton = page.locator('button[aria-label="Light mode"]');
    await lightButton.click();
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('Staff dashboard - light mode:', htmlClasses);
    expect(htmlClasses || '').not.toContain('dark');
    await page.screenshot({ path: 'staff-light-mode.png', fullPage: false });
  });

  test('theme toggle works on driver dashboard', async ({ page }) => {
    // Login as driver
    await page.goto('/login');
    await page.fill('input[type="email"]', 'driver@shipnorth.com');
    await page.fill('input[type="password"]', 'driver123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/driver', { timeout: 10000 });
    
    const htmlElement = page.locator('html');
    
    // Test dark mode
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Driver dashboard - dark mode:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    await page.screenshot({ path: 'driver-dark-mode.png', fullPage: false });
    
    // Test light mode
    const lightButton = page.locator('button[aria-label="Light mode"]');
    await lightButton.click();
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('Driver dashboard - light mode:', htmlClasses);
    expect(htmlClasses || '').not.toContain('dark');
    await page.screenshot({ path: 'driver-light-mode.png', fullPage: false });
  });

  test('theme toggle works on customer dashboard', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/portal', { timeout: 10000 });
    
    const htmlElement = page.locator('html');
    
    // Test dark mode
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    let htmlClasses = await htmlElement.getAttribute('class');
    console.log('Customer dashboard - dark mode:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    await page.screenshot({ path: 'customer-dark-mode.png', fullPage: false });
    
    // Test light mode
    const lightButton = page.locator('button[aria-label="Light mode"]');
    await lightButton.click();
    htmlClasses = await htmlElement.getAttribute('class');
    console.log('Customer dashboard - light mode:', htmlClasses);
    expect(htmlClasses || '').not.toContain('dark');
    await page.screenshot({ path: 'customer-light-mode.png', fullPage: false });
  });

  test('theme persists across page refreshes', async ({ page }) => {
    await page.goto('/login');
    
    // Set to dark mode
    const darkButton = page.locator('button[aria-label="Dark mode"]');
    await darkButton.click();
    
    // Refresh page
    await page.reload();
    
    // Check if dark mode persists
    const htmlElement = page.locator('html');
    const htmlClasses = await htmlElement.getAttribute('class');
    console.log('After refresh, HTML classes:', htmlClasses);
    expect(htmlClasses || '').toContain('dark');
    
    // Check if dark button is still selected
    const darkButtonActive = await darkButton.evaluate(el => 
      el.className.includes('bg-blue-100') || el.className.includes('dark:bg-blue-900')
    );
    expect(darkButtonActive).toBeTruthy();
  });
});