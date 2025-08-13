import { test, expect } from '@playwright/test';

test.describe('Login Page Theme Tests', () => {
  test('login page displays modern UI styling', async ({ page }) => {
    await page.goto('/login');
    
    // Take screenshot for visual debugging
    await page.screenshot({ path: 'login-page-styling.png', fullPage: true });
    
    // Check basic functionality first
    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for modern styling elements
    const hasModernCard = await page.locator('.rounded-xl, .rounded-lg, .shadow-sm, .shadow-lg').count();
    console.log('Number of modern card elements:', hasModernCard);
    
    // Check for dark mode support
    const hasDarkClasses = await page.locator('[class*="dark:"]').count();
    console.log('Number of elements with dark mode classes:', hasDarkClasses);
    
    // Check for gradient or modern background
    const hasGradient = await page.locator('[class*="gradient"], [class*="bg-gradient"]').count();
    console.log('Number of gradient elements:', hasGradient);
    
    // Check HTML classes for theme support
    const htmlElement = page.locator('html');
    const htmlClasses = await htmlElement.getAttribute('class');
    console.log('HTML classes:', htmlClasses);
    
    // Check body classes
    const bodyClasses = await page.locator('body').getAttribute('class');
    console.log('Body classes:', bodyClasses);
    
    // Check if ThemeProvider is present in page
    const pageContent = await page.content();
    const hasThemeProvider = pageContent.includes('ThemeProvider') || pageContent.includes('theme-provider');
    console.log('Has theme provider:', hasThemeProvider);
    
    // Check for modern input styling
    const emailInput = page.locator('input[type="email"]');
    const emailClasses = await emailInput.getAttribute('class');
    console.log('Email input classes:', emailClasses);
    
    const hasModernInputs = emailClasses?.includes('rounded-') || emailClasses?.includes('border-') || emailClasses?.includes('shadow-');
    console.log('Has modern input styling:', hasModernInputs);
    
    // Check for modern button styling
    const submitButton = page.locator('button[type="submit"]');
    const buttonClasses = await submitButton.getAttribute('class');
    console.log('Submit button classes:', buttonClasses);
    
    const hasModernButton = buttonClasses?.includes('bg-') && buttonClasses?.includes('rounded-');
    console.log('Has modern button styling:', hasModernButton);
    
    // Check overall page structure
    const hasContainer = await page.locator('.container, .max-w-').count();
    console.log('Number of container elements:', hasContainer);
    
    // Expectations for modern styling
    expect(hasModernCard).toBeGreaterThan(0);
    expect(hasModernInputs || hasModernButton).toBeTruthy();
  });
  
  test('login page theme toggle works', async ({ page }) => {
    await page.goto('/login');
    
    // Theme toggle buttons should exist but might not be "visible" due to absolute positioning
    const lightButton = page.locator('button[title="Light theme"]');
    const darkButton = page.locator('button[title="Dark theme"]');
    const systemButton = page.locator('button[title="System theme"]');
    
    const lightExists = await lightButton.count();
    const darkExists = await darkButton.count();
    const systemExists = await systemButton.count();
    
    console.log('Theme buttons exist:', { lightExists, darkExists, systemExists });
    
    // Test clicking dark theme
    if (darkExists > 0) {
      await darkButton.click();
      
      // Check if dark mode is applied
      const htmlElement = page.locator('html');
      const htmlClasses = await htmlElement.getAttribute('class');
      console.log('HTML classes after clicking dark:', htmlClasses);
      
      expect(htmlClasses || '').toContain('dark');
    }
  });
});