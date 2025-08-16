import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Web Interface Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for web tests
    test.setTimeout(config.timeout);
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(config.webUrl);
    
    // Check for main page elements
    await expect(page).toHaveTitle(/Shipnorth/);
    await expect(page.locator('h1')).toContainText('Shipnorth');
    await expect(page.locator('h2').first()).toContainText('Autonomous Shipping & Billing');
    
    // Check for navigation elements (Next.js uses /login/ with trailing slash)
    await expect(page.locator('a[href="/login/"]').first()).toBeVisible();
  });

  test('Login page loads and form works', async ({ page }) => {
    await page.goto(`${config.webUrl}/login/`);
    
    // Check page loads (Next.js app uses global title)
    await expect(page).toHaveTitle(/Shipnorth - Modern Logistics Platform/);
    await expect(page.locator('h2')).toContainText('Welcome back');
    
    // Check form elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Next.js form starts empty, unlike static HTML
    const emailValue = await page.locator('#email').inputValue();
    const passwordValue = await page.locator('#password').inputValue();
    expect(emailValue).toBe('');
    expect(passwordValue).toBe('');
  });

  test('Admin login flow works end-to-end', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${config.webUrl}/login/`);
    
    // Fill in admin credentials (should be pre-filled)
    await page.fill('#email', config.testUsers.admin.email);
    await page.fill('#password', config.testUsers.admin.password);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard (Next.js does direct redirect)
    await expect(page).toHaveURL(`${config.webUrl}/admin/`);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check admin email is displayed
    await expect(page.locator('#userEmail')).toContainText(config.testUsers.admin.email);
    
    // Check system status loads
    await expect(page.locator('#systemStatus')).toBeVisible();
    
    // Eventually should show system healthy status
    await expect(page.locator('#systemStatus')).toContainText('System Healthy', { timeout: 10000 });
  });

  test('Staff login redirects to staff dashboard', async ({ page }) => {
    await page.goto(`${config.webUrl}/login.html`);
    
    // Fill in staff credentials
    await page.fill('#email', config.testUsers.staff.email);
    await page.fill('#password', config.testUsers.staff.password);
    
    await page.click('#signInBtn');
    
    // Wait for success and redirect
    await expect(page.locator('#successMessage')).toBeVisible();
    await expect(page).toHaveURL(`${config.webUrl}/staff.html`);
    await expect(page.locator('h1')).toContainText('Shipnorth Staff');
  });

  test('Customer login redirects to customer portal', async ({ page }) => {
    await page.goto(`${config.webUrl}/login.html`);
    
    // Fill in customer credentials
    await page.fill('#email', config.testUsers.customer.email);
    await page.fill('#password', config.testUsers.customer.password);
    
    await page.click('#signInBtn');
    
    // Wait for success and redirect
    await expect(page.locator('#successMessage')).toBeVisible();
    await expect(page).toHaveURL(`${config.webUrl}/customer.html`);
    await expect(page.locator('h1')).toContainText('Shipnorth Customer Portal');
  });

  test('Driver login redirects to driver dashboard', async ({ page }) => {
    await page.goto(`${config.webUrl}/login.html`);
    
    // Fill in driver credentials
    await page.fill('#email', config.testUsers.driver.email);
    await page.fill('#password', config.testUsers.driver.password);
    
    await page.click('#signInBtn');
    
    // Wait for success and redirect
    await expect(page.locator('#successMessage')).toBeVisible();
    await expect(page).toHaveURL(`${config.webUrl}/driver.html`);
    await expect(page.locator('h1')).toContainText('Shipnorth Driver');
  });

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto(`${config.webUrl}/login.html`);
    
    // Fill in invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    
    await page.click('#signInBtn');
    
    // Should show error message
    await expect(page.locator('#errorMessage')).toBeVisible();
    await expect(page.locator('#errorMessage')).toContainText(/Login failed|Invalid credentials/);
    
    // Should stay on login page
    await expect(page).toHaveURL(`${config.webUrl}/login.html`);
  });

  test('Logout functionality works', async ({ page }) => {
    // First login as admin
    await page.goto(`${config.webUrl}/login.html`);
    await page.fill('#email', config.testUsers.admin.email);
    await page.fill('#password', config.testUsers.admin.password);
    await page.click('#signInBtn');
    
    // Wait for redirect to admin page
    await expect(page).toHaveURL(`${config.webUrl}/admin.html`);
    
    // Click logout button
    await page.click('#logoutBtn');
    
    // Should redirect back to login page
    await expect(page).toHaveURL(`${config.webUrl}/login.html`);
  });

  test('Navigation between pages works', async ({ page }) => {
    // Start from homepage
    await page.goto(config.webUrl);
    
    // Click Sign In button
    await page.click('a[href="/login.html"]');
    await expect(page).toHaveURL(`${config.webUrl}/login.html`);
    
    // Click back to home
    await page.click('a[href="/index.html"]');
    await expect(page).toHaveURL(`${config.webUrl}/index.html`);
  });
});

test.describe('Environment-specific tests', () => {
  test(`Current environment: ${config.environment}`, async ({ page }) => {
    console.log(`Running tests against: ${config.environment}`);
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`Web URL: ${config.webUrl}`);
    
    // Just verify the URLs are reachable
    await page.goto(config.webUrl);
    await expect(page).toHaveTitle(/Shipnorth/);
  });
});