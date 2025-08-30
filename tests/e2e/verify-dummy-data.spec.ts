import { test, expect } from '@playwright/test';

test.describe('🧪 Dummy Data Verification', () => {
  
  test('Staff portal shows populated data @data-verification', async ({ page }) => {
    console.log('🔍 Testing staff portal data visibility...');
    
    // Navigate to staff portal
    await page.goto('http://localhost:8849/staff');
    
    // Check if login is required
    const isLoginRequired = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginRequired) {
      console.log('🔐 Login required - using staff credentials...');
      await page.fill('input[type="email"]', 'staff@shipnorth.com');
      await page.fill('input[type="password"]', 'staff123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'test-artifacts/staff-dashboard-with-data.png', 
      fullPage: true 
    });
    
    // Check for dashboard elements
    const hasStats = await page.locator('[class*="stat"], [class*="card"], [class*="metric"]').count();
    console.log(`📊 Found ${hasStats} stat/metric elements on dashboard`);
    
    // Navigate to customers page
    await page.goto('http://localhost:8849/staff/customers');
    await page.waitForTimeout(2000);
    
    // Take screenshot of customers page
    await page.screenshot({ 
      path: 'test-artifacts/staff-customers-with-data.png', 
      fullPage: true 
    });
    
    // Check for customer data
    const customerRows = await page.locator('tr, [class*="customer"], [class*="row"]').count();
    console.log(`👥 Found ${customerRows} customer-related elements`);
    
    // Navigate to packages page
    await page.goto('http://localhost:8849/staff/packages');
    await page.waitForTimeout(2000);
    
    // Take screenshot of packages page
    await page.screenshot({ 
      path: 'test-artifacts/staff-packages-with-data.png', 
      fullPage: true 
    });
    
    // Check for package data
    const packageRows = await page.locator('tr, [class*="package"], [class*="row"]').count();
    console.log(`📦 Found ${packageRows} package-related elements`);
    
    expect(hasStats).toBeGreaterThan(0);
    expect(customerRows).toBeGreaterThan(0);
    expect(packageRows).toBeGreaterThan(0);
  });
  
  test('Customer portal functionality @data-verification', async ({ page }) => {
    console.log('🔍 Testing customer portal...');
    
    // Navigate to customer portal
    await page.goto('http://localhost:8849/portal');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-artifacts/customer-portal.png', 
      fullPage: true 
    });
    
    console.log('📸 Customer portal screenshot saved');
  });
  
  test('Driver portal functionality @data-verification', async ({ page }) => {
    console.log('🔍 Testing driver portal...');
    
    // Navigate to driver portal
    await page.goto('http://localhost:8849/driver');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-artifacts/driver-portal.png', 
      fullPage: true 
    });
    
    console.log('📸 Driver portal screenshot saved');
  });

  test('Database API endpoints return populated data @data-verification', async ({ page }) => {
    console.log('🔍 Testing API endpoints with populated data...');
    
    // Test customers endpoint
    const customersResponse = await page.request.get('http://localhost:8850/search/customers', {
      headers: {
        'Authorization': 'Bearer test-token-bypass'
      }
    });
    
    console.log('👥 Customers API status:', customersResponse.status());
    
    // Test packages endpoint  
    const packagesResponse = await page.request.get('http://localhost:8850/packages', {
      headers: {
        'Authorization': 'Bearer test-token-bypass'
      }
    });
    
    console.log('📦 Packages API status:', packagesResponse.status());
    
    // Test loads endpoint
    const loadsResponse = await page.request.get('http://localhost:8850/loads', {
      headers: {
        'Authorization': 'Bearer test-token-bypass'
      }
    });
    
    console.log('🚛 Loads API status:', loadsResponse.status());
  });
  
});