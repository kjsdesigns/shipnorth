import { test, expect, Page } from '@playwright/test';

test.describe('Data Consistency Verification', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Login as admin to access all data
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/staff');
  });

  test('Customers page shows addresses and proper data', async () => {
    console.log('🧪 Testing customers page data consistency...');
    
    // Navigate to customers page
    await page.goto('http://localhost:3000/staff/customers');
    await page.waitForSelector('[data-testid="customers-table"], table');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-debug-customers.png', fullPage: true });
    
    // Check that customers have addresses displayed
    const customerRows = await page.locator('tbody tr').count();
    expect(customerRows).toBeGreaterThan(0);
    
    console.log(`📊 Found ${customerRows} customer rows`);
    
    // Check first few customers have address data
    for (let i = 0; i < Math.min(3, customerRows); i++) {
      const row = page.locator(`tbody tr:nth-child(${i + 1})`);
      
      // Get customer name
      const customerName = await row.locator('td:nth-child(1)').textContent();
      
      // Get address cell (should not be empty or just commas)
      const addressCell = row.locator('td:nth-child(3)'); // ADDRESS column
      const addressText = await addressCell.textContent();
      
      console.log(`  Customer ${i + 1}: ${customerName?.trim()}`);
      console.log(`  Address: "${addressText?.trim()}"`);
      
      // Verify address is not empty or just punctuation
      expect(addressText?.trim()).toBeTruthy();
      expect(addressText?.trim()).not.toBe(',');
      expect(addressText?.trim()).not.toBe(',,');
    }
  });

  test('Packages page shows customer names and addresses', async () => {
    console.log('🧪 Testing packages page data consistency...');
    
    // Navigate to packages page
    await page.goto('http://localhost:3000/staff/packages');
    await page.waitForSelector('table');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-debug-packages.png', fullPage: true });
    
    // Check that packages have customer and address data
    const packageRows = await page.locator('tbody tr').count();
    expect(packageRows).toBeGreaterThan(0);
    
    console.log(`📦 Found ${packageRows} package rows`);
    
    // Check first few packages have customer and address data
    for (let i = 0; i < Math.min(3, packageRows); i++) {
      const row = page.locator(`tbody tr:nth-child(${i + 1})`);
      
      // Get tracking number
      const trackingCell = row.locator('td:nth-child(2)'); // After checkbox column
      const trackingNumber = await trackingCell.textContent();
      
      // Get customer name (should not be "Unknown")
      const customerCell = row.locator('td:nth-child(4)'); // CUSTOMER column
      const customerName = await customerCell.textContent();
      
      // Get delivery address (should not be empty)
      const addressCell = row.locator('td:nth-child(5)'); // DELIVERY ADDRESS column  
      const addressText = await addressCell.textContent();
      
      console.log(`  Package ${i + 1}: ${trackingNumber?.trim()}`);
      console.log(`  Customer: "${customerName?.trim()}"`);
      console.log(`  Address: "${addressText?.trim()}"`);
      
      // Verify customer is not "Unknown"
      expect(customerName?.trim()).not.toBe('Unknown');
      expect(customerName?.trim()).toBeTruthy();
      
      // Verify address is populated
      expect(addressText?.trim()).toBeTruthy();
      expect(addressText?.trim()).not.toBe('Unknown');
    }
  });

  test('Customer detail page shows complete information', async () => {
    console.log('🧪 Testing customer detail page...');
    
    // Go to customers page first
    await page.goto('http://localhost:3000/staff/customers');
    await page.waitForSelector('table');
    await page.waitForTimeout(2000);
    
    // Click on first customer to view details
    const firstCustomerLink = page.locator('tbody tr:first-child td:first-child a');
    await firstCustomerLink.click();
    
    // Wait for customer detail page to load
    await page.waitForURL('**/staff/customers/**');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-debug-customer-detail.png', fullPage: true });
    
    // Verify customer information is displayed
    const customerNameElement = await page.locator('h1, [data-testid="customer-name"]').first();
    const customerName = await customerNameElement.textContent();
    
    console.log(`👤 Customer detail page for: ${customerName?.trim()}`);
    expect(customerName?.trim()).toBeTruthy();
    expect(customerName?.trim()).not.toBe('Unknown');
  });

  test('Package detail page shows customer and address info', async () => {
    console.log('🧪 Testing package detail page...');
    
    // Go to packages page first
    await page.goto('http://localhost:3000/staff/packages');
    await page.waitForSelector('table');
    await page.waitForTimeout(2000);
    
    // Click on first package to view details (tracking number link)
    const firstPackageLink = page.locator('tbody tr:first-child td:nth-child(2) a, tbody tr:first-child td:nth-child(2) button');
    await firstPackageLink.click();
    
    // Wait for edit modal or detail page to open
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-debug-package-detail.png', fullPage: true });
    
    // If it's a modal, verify the content
    const modalVisible = await page.locator('[role="dialog"], .modal, .fixed.inset-0').isVisible();
    if (modalVisible) {
      console.log('📝 Package edit modal opened');
      
      // Check that customer is selected (not empty)
      const customerInput = page.locator('input[placeholder*="customer"], select[name*="customer"]');
      const customerValue = await customerInput.getAttribute('value') || await customerInput.inputValue();
      
      console.log(`🔗 Customer field value: "${customerValue}"`);
      expect(customerValue).toBeTruthy();
    }
  });

  test('Bulk selection functionality works', async () => {
    console.log('🧪 Testing bulk selection functionality...');
    
    // Navigate to packages page
    await page.goto('http://localhost:3000/staff/packages');
    await page.waitForSelector('table');
    await page.waitForTimeout(2000);
    
    // Check that header checkbox exists
    const headerCheckbox = page.locator('thead input[type="checkbox"], thead button[role="checkbox"]');
    await expect(headerCheckbox).toBeVisible();
    
    // Click header checkbox to select all
    await headerCheckbox.click();
    await page.waitForTimeout(1000);
    
    // Verify bulk actions bar appears
    const bulkActionsBar = page.locator('text="selected", .bg-blue-50');
    await expect(bulkActionsBar).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-debug-bulk-select.png', fullPage: true });
    
    // Verify individual checkboxes are checked
    const checkedBoxes = await page.locator('tbody input[type="checkbox"]:checked').count();
    expect(checkedBoxes).toBeGreaterThan(0);
    
    console.log(`✅ Bulk selection working: ${checkedBoxes} packages selected`);
    
    // Test bulk action buttons exist
    await expect(page.locator('text="Assign to Load"')).toBeVisible();
    await expect(page.locator('text="Remove from Load"')).toBeVisible(); 
    await expect(page.locator('text="Mark Delivered"')).toBeVisible();
  });
});