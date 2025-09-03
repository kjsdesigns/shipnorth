import { test, expect } from '@playwright/test';

const WEB_BASE = `http://localhost:${process.env.WEB_PORT || 8849}`;
const TEST_LOAD_ID = '4607eeb1-3336-4c34-9bfb-f3c50bc91054';

test.describe('Load Package Display Verification', () => {
  test('should show 30 packages in the Quebec test load', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto(`${WEB_BASE}/login`);
    
    // Step 2: Login as staff
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    // Step 3: Wait for redirect to staff dashboard
    await expect(page).toHaveURL(/\/staff/, { timeout: 10000 });
    
    // Step 4: Navigate directly to our test load
    await page.goto(`${WEB_BASE}/staff/loads/${TEST_LOAD_ID}`);
    
    // Step 5: Wait for page to load completely
    await expect(page.locator('text=Quebec Route Test')).toBeVisible({ timeout: 15000 });
    
    // Step 6: Verify the load header shows correct info
    await expect(page.locator('h1')).toContainText('Load #');
    await expect(page.locator('text=Freightliner Cascadia')).toBeVisible();
    
    // Step 7: Verify package count in header - should show "30 packages"
    await expect(page.locator('text=30 packages')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Verify package summary section exists
    await expect(page.locator('text=Packages (30)')).toBeVisible({ timeout: 10000 });
    
    // Step 9: Verify individual packages are displayed in the grid
    const packageCards = page.locator('.grid').locator('.border').filter({ hasText: 'TEST-' });
    await expect(packageCards.first()).toBeVisible({ timeout: 10000 });
    
    // Step 10: Count visible package cards (should show at least 12 + "more" indicator)
    const visibleCards = await packageCards.count();
    expect(visibleCards).toBeGreaterThanOrEqual(12);
    
    // Step 11: If more than 12 packages, verify "more packages" indicator
    if (visibleCards >= 12) {
      await expect(page.locator('text=+18 more packages')).toBeVisible();
    }
    
    // Step 12: Verify package details are shown correctly
    const firstPackage = packageCards.first();
    await expect(firstPackage.locator('text=/TEST-\\d+-\\d+-\\d+/')).toBeVisible(); // Barcode pattern
    await expect(firstPackage.locator('text=/\\d+\\.\\d+kg/')).toBeVisible(); // Weight
    
    // Step 13: Verify Quebec towns are mentioned in package addresses
    const quebecCities = ['Chibougamau', 'Val-d\'Or', 'Rouyn-Noranda', 'Amos', 'La Sarre'];
    let foundQuebecCity = false;
    
    for (const city of quebecCities) {
      if (await page.locator(`text=${city}`).isVisible()) {
        foundQuebecCity = true;
        break;
      }
    }
    expect(foundQuebecCity).toBeTruthy();
    
    // Step 14: Verify route optimization interface is present
    await expect(page.locator('text=Route Optimizer')).toBeVisible();
    await expect(page.locator('button:has-text("AI Optimize")')).toBeVisible();
    
    // Step 15: Verify the optimize button is enabled (not disabled due to no packages)
    await expect(page.locator('button:has-text("AI Optimize")')).toBeEnabled();
    
    console.log('✅ All package display verification checks passed!');
  });

  test('should perform route optimization and show results', async ({ page }) => {
    // Setup: Login and navigate to test load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/staff/);
    await page.goto(`${WEB_BASE}/staff/loads/${TEST_LOAD_ID}`);
    
    // Wait for packages to load
    await expect(page.locator('text=30 packages')).toBeVisible({ timeout: 15000 });
    
    // Click AI Optimize button
    await page.click('button:has-text("AI Optimize")');
    
    // Verify optimization starts
    await expect(page.locator('text=Optimizing...')).toBeVisible({ timeout: 5000 });
    
    // Wait for optimization to complete
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 45000 });
    
    // Verify optimized route results are displayed
    await expect(page.locator('text=Optimized Route')).toBeVisible({ timeout: 10000 });
    
    // Verify route summary metrics
    await expect(page.locator('text=Distance')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible(); 
    await expect(page.locator('text=Stops')).toBeVisible();
    
    // Verify route steps are shown
    await expect(page.locator('text=Route Steps')).toBeVisible();
    
    // Verify at least one city cluster is displayed
    await expect(page.locator('text=/\\d+\\. [A-Za-z-\']+, QC/')).toBeVisible();
    
    // Verify packages are shown in route stops
    await expect(page.locator('text=/📦 \\d+ packages/')).toBeVisible();
    
    console.log('✅ Route optimization functionality verified!');
  });
});