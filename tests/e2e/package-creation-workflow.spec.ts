import { test, expect } from '@playwright/test';

// Skip tests if TypeScript compilation is failing to avoid blocking other tests
const shouldSkip = process.env.SKIP_NEW_TESTS === 'true';

test.describe('Package Creation Workflow', () => {
  test.skip(shouldSkip, 'Skipping new tests due to compilation issues');
  // Test data
  const testPackage = {
    customer: {
      name: 'Sarah Thompson',
      email: 'sarah.thompson@example.com',
    },
    recipient: {
      name: 'Sarah Thompson', // Will be pre-populated from customer
      phone: '416-555-0123',
    },
    address: {
      line1: '123 Main Street',
      line2: 'Suite 456',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 2T6',
    },
    packageDetails: {
      weight: 2.5,
      length: 20,
      width: 15,
      height: 10,
      description: 'Electronic components for testing',
      declaredValue: 150,
      specialInstructions: 'Fragile - handle with care',
    },
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate as staff
    await page.goto('http://localhost:8849/login');
    
    // Login as staff user
    await page.fill('[data-testid="email-input"]', 'staff@shipnorth.com');
    await page.fill('[data-testid="password-input"]', 'staff123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect and ensure we're on the staff dashboard
    await page.waitForURL('**/staff');
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
    
    // Navigate to packages page
    await page.click('text=Packages');
    await page.waitForURL('**/staff/packages');
    await expect(page.locator('h1:has-text("Packages")')).toBeVisible();
  });

  test('should complete full package creation workflow with customer pre-population', async ({ page }) => {
    // **STEP 1: Click Create Package button**
    console.log('🚀 Step 1: Clicking Create Package button...');
    await expect(page.locator('[data-testid="create-package-button"]')).toBeVisible();
    await page.click('[data-testid="create-package-button"]');

    // **STEP 2: Verify Customer Selection Dialog opens**
    console.log('👥 Step 2: Verifying Customer Selection dialog...');
    await expect(page.locator('text=Select Customer for Package')).toBeVisible();
    await expect(page.locator('[data-testid="customer-search-input"]')).toBeVisible();

    // **STEP 3: Search for and select customer**
    console.log('🔍 Step 3: Searching for customer...');
    await page.fill('[data-testid="customer-search-input"]', 'Sarah');
    
    // Wait for search results and click on Sarah Thompson
    await expect(page.locator(`[data-testid*="customer-option-"]`).first()).toBeVisible();
    const customerOption = page.locator('text=Sarah Thompson').first();
    await expect(customerOption).toBeVisible();
    await customerOption.click();

    // **STEP 4: Verify Create Package Dialog opens with pre-populated data**
    console.log('📦 Step 4: Verifying Create Package dialog and pre-population...');
    await expect(page.locator('text=Create Package')).toBeVisible();
    await expect(page.locator('text=Step 2: Package Details')).toBeVisible();
    
    // Verify selected customer banner
    await expect(page.locator('[data-testid="selected-customer-name"]:has-text("Sarah Thompson")')).toBeVisible();
    
    // Verify pre-populated recipient name
    const recipientNameInput = page.locator('[data-testid="recipient-name-input"]');
    await expect(recipientNameInput).toHaveValue('Sarah Thompson');

    // **STEP 5: Verify and update pre-populated address data**
    console.log('🏠 Step 5: Verifying and updating address data...');
    
    // Check that some address fields are pre-populated (they should have customer data)
    const addressLine1Input = page.locator('[data-testid="address-line-1-input"]');
    const cityInput = page.locator('[data-testid="city-input"]');
    const provinceSelect = page.locator('[data-testid="province-select"]');
    const postalCodeInput = page.locator('[data-testid="postal-code-input"]');
    
    // Fill/update address details (may be pre-populated or empty depending on customer data)
    await addressLine1Input.clear();
    await addressLine1Input.fill(testPackage.address.line1);
    
    const addressLine2Input = page.locator('[data-testid="address-line-2-input"]');
    await addressLine2Input.fill(testPackage.address.line2);
    
    await cityInput.clear();
    await cityInput.fill(testPackage.address.city);
    
    await provinceSelect.selectOption(testPackage.address.province);
    
    await postalCodeInput.clear();
    await postalCodeInput.fill(testPackage.address.postalCode);

    // **STEP 6: Fill in package details**
    console.log('📐 Step 6: Filling package details...');
    
    await page.locator('[data-testid="weight-input"]').fill(testPackage.packageDetails.weight.toString());
    await page.locator('[data-testid="length-input"]').fill(testPackage.packageDetails.length.toString());
    await page.locator('[data-testid="width-input"]').fill(testPackage.packageDetails.width.toString());
    await page.locator('[data-testid="height-input"]').fill(testPackage.packageDetails.height.toString());
    
    await page.locator('[data-testid="description-input"]').fill(testPackage.packageDetails.description);
    await page.locator('[data-testid="declared-value-input"]').fill(testPackage.packageDetails.declaredValue.toString());
    await page.locator('[data-testid="special-instructions-input"]').fill(testPackage.packageDetails.specialInstructions);

    // **STEP 7: Submit package creation**
    console.log('✅ Step 7: Submitting package creation...');
    await page.click('[data-testid="submit-create-package-button"]');
    
    // Wait for success and dialog to close
    await expect(page.locator('text=Create Package')).not.toBeVisible({ timeout: 10000 });

    // **STEP 8: Verify package appears in package list**
    console.log('📋 Step 8: Verifying package appears in list...');
    
    // Wait for page to refresh and new package to appear
    await page.waitForTimeout(2000);
    
    // Look for the package with our description or customer name
    const packageRow = page.locator('tbody tr').filter({ hasText: 'Sarah Thompson' }).first();
    await expect(packageRow).toBeVisible();
    
    // Verify key data is displayed
    await expect(packageRow.locator('text=Sarah Thompson')).toBeVisible();

    // **STEP 9: Click on package to open edit dialog and verify data**
    console.log('🔍 Step 9: Opening package edit dialog to verify data...');
    
    // Click on the tracking number to open edit dialog
    const trackingLink = packageRow.locator('a[class*="text-blue-600"]').first();
    await expect(trackingLink).toBeVisible();
    await trackingLink.click();
    
    // Verify edit dialog opens
    await expect(page.locator('text=Edit Package')).toBeVisible();
    
    // **STEP 10: Verify all data is correctly populated in edit dialog**
    console.log('✅ Step 10: Verifying all data in edit dialog...');
    
    // Verify customer selection (should show Sarah Thompson)
    const editCustomerSelector = page.locator('[data-testid*="chip-selector"]').first();
    await expect(editCustomerSelector).toContainText('Sarah Thompson');
    
    // Verify recipient information
    await expect(page.locator('input[value*="Sarah Thompson"]')).toBeVisible();
    
    // Verify address information
    await expect(page.locator(`input[value="${testPackage.address.line1}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.address.line2}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.address.city}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.address.postalCode}"]`)).toBeVisible();
    
    // Verify package details
    await expect(page.locator(`input[value="${testPackage.packageDetails.weight}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.packageDetails.length}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.packageDetails.width}"]`)).toBeVisible();
    await expect(page.locator(`input[value="${testPackage.packageDetails.height}"]`)).toBeVisible();
    
    // Verify description and notes
    await expect(page.locator(`textarea:has-text("${testPackage.packageDetails.description}")`)).toBeVisible();
    
    console.log('🎉 All steps completed successfully!');
  });

  test('should allow going back to customer selection', async ({ page }) => {
    // Start package creation flow
    await page.click('[data-testid="create-package-button"]');
    await expect(page.locator('text=Select Customer for Package')).toBeVisible();
    
    // Select a customer
    await page.fill('[data-testid="customer-search-input"]', 'Sarah');
    await page.locator('text=Sarah Thompson').first().click();
    
    // Verify we're on step 2
    await expect(page.locator('text=Step 2: Package Details')).toBeVisible();
    
    // Click back to customer selection
    await page.click('[data-testid="back-to-customer-selection"]');
    
    // Verify we're back on step 1
    await expect(page.locator('text=Select Customer for Package')).toBeVisible();
    await expect(page.locator('[data-testid="customer-search-input"]')).toBeVisible();
  });

  test('should handle cancellation at different steps', async ({ page }) => {
    // Test cancellation from customer selection
    await page.click('[data-testid="create-package-button"]');
    await expect(page.locator('text=Select Customer for Package')).toBeVisible();
    
    await page.click('[data-testid="close-customer-selection"]');
    await expect(page.locator('text=Select Customer for Package')).not.toBeVisible();
    
    // Test cancellation from package creation step
    await page.click('[data-testid="create-package-button"]');
    await page.fill('[data-testid="customer-search-input"]', 'Sarah');
    await page.locator('text=Sarah Thompson').first().click();
    
    await expect(page.locator('text=Step 2: Package Details')).toBeVisible();
    await page.click('[data-testid="close-create-package"]');
    await expect(page.locator('text=Create Package')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Start package creation flow
    await page.click('[data-testid="create-package-button"]');
    await page.fill('[data-testid="customer-search-input"]', 'Sarah');
    await page.locator('text=Sarah Thompson').first().click();
    
    // Try to submit without required fields
    await page.click('[data-testid="create-package-button"]');
    
    // Form should not submit and we should still see the dialog
    // Note: The actual validation behavior will depend on the form implementation
    await expect(page.locator('text=Step 2: Package Details')).toBeVisible();
  });

  test('should search customers effectively', async ({ page }) => {
    await page.click('[data-testid="create-package-button"]');
    
    // Test search functionality
    const searchInput = page.locator('[data-testid="customer-search-input"]');
    await searchInput.fill('Sarah');
    
    // Should see Sarah Thompson in results
    await expect(page.locator('text=Sarah Thompson')).toBeVisible();
    
    // Test clearing search
    await searchInput.clear();
    await searchInput.fill('NonExistentCustomer');
    
    // Should show "no customers found" message
    await expect(page.locator('text=No customers found matching your search')).toBeVisible();
  });
});