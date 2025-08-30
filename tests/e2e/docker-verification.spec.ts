import { test, expect } from '@playwright/test';

test.describe('Docker Infrastructure Test', () => {
  test('API health check works', async ({ page }) => {
    console.log('🔍 Testing API health endpoint...');
    
    const response = await page.request.get('http://localhost:8850/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    console.log('✅ API health check passed');
  });

  test('Web homepage loads', async ({ page }) => {
    console.log('🌐 Testing web homepage...');
    
    await page.goto('http://localhost:8849');
    await expect(page).toHaveTitle(/Shipnorth/);
    
    // Check for key homepage elements
    await expect(page.locator('h2:has-text("Autonomous Shipping")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")').first()).toBeVisible();
    console.log('✅ Homepage loads correctly');
  });

  test('Login page loads', async ({ page }) => {
    console.log('🔑 Testing login page...');
    
    await page.goto('http://localhost:8849/login');
    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
    
    // Check for login buttons (use more specific selectors)
    await expect(page.locator('button').filter({ hasText: 'Staff' }).first()).toBeVisible();
    await expect(page.locator('button:has-text("Customer")')).toBeVisible();
    console.log('✅ Login page loads correctly');
  });
});