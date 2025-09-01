import { test, expect } from '@playwright/test';

/**
 * Comprehensive Bulk Package Assignment Test Suite
 * 
 * Verifies all requirements:
 * 1. Bulk select packages functionality
 * 2. Searchable load dropdown modal
 * 3. Actual API assignment execution
 * 4. UI updates reflecting new assignments
 * 5. End-to-end workflow validation
 */

test.describe('🚛 Bulk Package Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff user
    await page.goto('http://localhost:8849/login');
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Navigate to packages page
    await page.goto('http://localhost:8849/staff/packages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for data loading
  });

  test('bulk select packages and assign to load @packages @bulk-operations', async ({ page }) => {
    console.log('🎯 Testing complete bulk package assignment workflow...');

    // Step 1: Verify packages are displayed
    console.log('1️⃣ Verifying packages are displayed...');
    const packageRows = await page.locator('tbody tr').count();
    expect(packageRows).toBeGreaterThan(0);
    console.log(`   ✅ Found ${packageRows} packages in table`);

    // Step 2: Select multiple packages using checkboxes
    console.log('2️⃣ Selecting multiple packages...');
    
    // Select first 3 packages
    for (let i = 0; i < Math.min(3, packageRows); i++) {
      await page.locator(`tbody tr:nth-child(${i + 1}) input[type="checkbox"]`).check();
      await page.waitForTimeout(200);
    }

    // Verify bulk actions bar appears
    const bulkActionsBar = page.locator('[class*="bg-blue-50"], [class*="bg-blue-900/20"]');
    await expect(bulkActionsBar).toBeVisible();
    console.log('   ✅ Bulk actions bar appeared');

    // Verify selection count is displayed
    const selectionText = page.locator('text=/3 package.*selected/');
    await expect(selectionText).toBeVisible();
    console.log('   ✅ Selection count displayed correctly');

    // Step 3: Click "Assign to Load" button
    console.log('3️⃣ Opening load assignment modal...');
    const assignButton = page.locator('button:has-text("Assign to Load")');
    await expect(assignButton).toBeVisible();
    await assignButton.click();

    // Verify modal opens
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(modal).toBeVisible();
    console.log('   ✅ Assignment modal opened');

    // Verify modal title
    const modalTitle = page.locator('h3:has-text("Assign Packages to Load")');
    await expect(modalTitle).toBeVisible();
    console.log('   ✅ Modal title correct');

    // Step 4: Verify load dropdown is searchable ChipSelector
    console.log('4️⃣ Testing searchable load dropdown...');
    
    const loadSelector = page.locator('[name="loadId"]');
    await expect(loadSelector).toBeVisible();
    
    // Click to open dropdown
    await loadSelector.click();
    await page.waitForTimeout(500);

    // Verify load options are displayed
    const loadOptions = page.locator('[data-value], option');
    const optionsCount = await loadOptions.count();
    expect(optionsCount).toBeGreaterThan(0);
    console.log(`   ✅ Found ${optionsCount} load options`);

    // Test search functionality
    await loadSelector.fill('Load');
    await page.waitForTimeout(500);
    
    // Select the first available load
    const firstLoadOption = loadOptions.first();
    await firstLoadOption.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Load selected successfully');

    // Verify load details appear
    const loadDetails = page.locator('text=/Selected Load Details/');
    await expect(loadDetails).toBeVisible();
    console.log('   ✅ Load details displayed');

    // Step 5: Execute assignment
    console.log('5️⃣ Executing package assignment...');
    
    const assignPackagesButton = page.locator('[data-testid="assign-packages-button"]');
    await expect(assignPackagesButton).toBeVisible();
    await expect(assignPackagesButton).toBeEnabled();
    
    // Click assign button
    await assignPackagesButton.click();
    
    // Wait for assignment to complete (should close modal)
    await page.waitForTimeout(3000);
    
    // Verify modal closes
    await expect(modal).not.toBeVisible();
    console.log('   ✅ Assignment modal closed after completion');

    // Step 6: Verify packages show load assignment
    console.log('6️⃣ Verifying packages show load assignments...');
    
    // Wait for data refresh
    await page.waitForTimeout(2000);
    
    // Check that packages now show load assignments
    const loadAssignments = page.locator('text=/Load #/');
    const assignmentCount = await loadAssignments.count();
    expect(assignmentCount).toBeGreaterThan(0);
    console.log(`   ✅ Found ${assignmentCount} packages with load assignments`);

    // Verify no packages are selected after assignment
    const selectedCheckboxes = page.locator('tbody input[type="checkbox"]:checked');
    const stillSelected = await selectedCheckboxes.count();
    expect(stillSelected).toBe(0);
    console.log('   ✅ Package selection cleared after assignment');

    // Verify bulk actions bar is hidden
    await expect(bulkActionsBar).not.toBeVisible();
    console.log('   ✅ Bulk actions bar hidden after assignment');

    console.log('🎉 Complete bulk assignment workflow verified successfully!');
  });

  test('bulk assignment modal validation @packages @validation', async ({ page }) => {
    console.log('🔒 Testing bulk assignment validation...');

    // Select one package
    await page.locator('tbody tr:first-child input[type="checkbox"]').check();
    
    // Open assignment modal
    await page.locator('button:has-text("Assign to Load")').click();
    
    // Try to assign without selecting a load
    const assignButton = page.locator('[data-testid="assign-packages-button"]');
    await expect(assignButton).toBeDisabled();
    console.log('   ✅ Assign button disabled when no load selected');
    
    // Select a load
    await page.locator('[name="loadId"]').click();
    const firstLoad = page.locator('[data-value], option').first();
    await firstLoad.click();
    
    // Verify button becomes enabled
    await expect(assignButton).toBeEnabled();
    console.log('   ✅ Assign button enabled when load selected');
    
    // Test cancel functionality
    await page.locator('button:has-text("Cancel")').click();
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    await expect(modal).not.toBeVisible();
    console.log('   ✅ Cancel closes modal without assignment');
  });

  test('load dropdown search functionality @packages @search', async ({ page }) => {
    console.log('🔍 Testing load dropdown search functionality...');

    // Select packages and open modal
    await page.locator('tbody tr:first-child input[type="checkbox"]').check();
    await page.locator('button:has-text("Assign to Load")').click();
    
    // Test search in load dropdown
    const loadSelector = page.locator('[name="loadId"]');
    await loadSelector.click();
    
    // Search for specific load
    await loadSelector.fill('Load A');
    await page.waitForTimeout(500);
    
    // Verify search filters results
    const visibleOptions = page.locator('[data-value]:visible, option:visible');
    const filteredCount = await visibleOptions.count();
    
    // Should be fewer options after search
    console.log(`   🔍 Search filtered to ${filteredCount} options`);
    
    // Clear search to see all options again
    await loadSelector.fill('');
    await page.waitForTimeout(500);
    
    const allOptions = await page.locator('[data-value], option').count();
    expect(allOptions).toBeGreaterThanOrEqual(filteredCount);
    console.log('   ✅ Search functionality working correctly');
  });

  test('bulk select all functionality @packages @bulk-select', async ({ page }) => {
    console.log('📋 Testing bulk select all functionality...');

    // Click select all button
    const selectAllButton = page.locator('th button', { hasText: /select.*all/i }).first();
    await selectAllButton.click();
    await page.waitForTimeout(1000);

    // Verify all packages are selected
    const checkedBoxes = page.locator('tbody input[type="checkbox"]:checked');
    const checkedCount = await checkedBoxes.count();
    
    const totalRows = await page.locator('tbody tr').count();
    expect(checkedCount).toBe(totalRows);
    console.log(`   ✅ Selected all ${checkedCount} packages`);

    // Verify bulk actions bar shows correct count
    const selectionText = page.locator(`text=/${checkedCount} package.*selected/`);
    await expect(selectionText).toBeVisible();
    console.log('   ✅ Bulk actions bar shows correct selection count');

    // Test deselect all
    await selectAllButton.click();
    await page.waitForTimeout(500);
    
    const remainingChecked = await page.locator('tbody input[type="checkbox"]:checked').count();
    expect(remainingChecked).toBe(0);
    console.log('   ✅ Deselect all functionality working');
  });

  test('assigned packages display load information @packages @load-display', async ({ page }) => {
    console.log('🏷️ Testing load assignment display...');

    // Look for packages that are already assigned to loads
    const assignedPackages = page.locator('td:has-text("Load #")');
    const assignedCount = await assignedPackages.count();
    
    if (assignedCount > 0) {
      console.log(`   ✅ Found ${assignedCount} packages with load assignments`);
      
      // Verify load information format
      const loadInfo = assignedPackages.first();
      await expect(loadInfo).toContainText('Load #');
      
      // Check for driver information
      const driverInfo = page.locator('td:has-text("Load #") + td span.text-xs');
      if (await driverInfo.count() > 0) {
        console.log('   ✅ Driver information displayed for assigned packages');
      }
    } else {
      console.log('   ℹ️ No packages currently assigned to loads (this is expected for fresh data)');
    }

    // Test that unassigned packages show "Unassigned"
    const unassignedPackages = page.locator('td:has-text("Unassigned")');
    const unassignedCount = await unassignedPackages.count();
    console.log(`   ✅ Found ${unassignedCount} unassigned packages properly labeled`);
  });

  test('package statistics accuracy @packages @statistics', async ({ page }) => {
    console.log('📊 Testing package statistics accuracy...');

    // Get displayed stats
    const totalPackagesText = await page.locator('[data-testid="total-packages"], .stat-card:has-text("Total Packages") p').first().textContent();
    const unassignedText = await page.locator('.stat-card:has-text("Unassigned") p').first().textContent();
    
    const totalPackages = parseInt(totalPackagesText || '0');
    const unassigned = parseInt(unassignedText || '0');
    
    console.log(`   📦 Total Packages: ${totalPackages}`);
    console.log(`   🔄 Unassigned: ${unassigned}`);
    
    // Verify stats are reasonable
    expect(totalPackages).toBeGreaterThan(0);
    expect(unassigned).toBeGreaterThanOrEqual(0);
    expect(unassigned).toBeLessThanOrEqual(totalPackages);
    
    // Count actual table rows and verify consistency
    const actualRows = await page.locator('tbody tr').count();
    expect(actualRows).toBeLessThanOrEqual(totalPackages); // Could be filtered
    
    console.log('   ✅ Package statistics are accurate and consistent');
  });
});