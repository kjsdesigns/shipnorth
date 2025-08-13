import { test, expect } from '@playwright/test';

test.describe('Basic Authentication Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Shipnorth/);
    await expect(page.locator('h2:has-text("Autonomous Shipping")')).toBeVisible();
  });

  test('login page loads successfully', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('admin can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
  });

  test('staff can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/staff', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
  });

  test('driver can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'driver@shipnorth.com');
    await page.fill('input[type="password"]', 'driver123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/driver', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
  });

  test('customer can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'john.doe@example.com');
    await page.fill('input[type="password"]', 'customer123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/portal', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error and stay on login page
    await expect(page.locator('text=/Invalid credentials/i')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });
});