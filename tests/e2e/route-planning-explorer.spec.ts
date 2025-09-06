import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { NavigationHelpers } from './utils/navigation-helpers';

test.describe('🛣️ Route Planning System Explorer', () => {
  test('Explore staff portal for route planning features @exploration', async ({ page }) => {
    const authHelper = new AuthHelpers(page);
    const navHelper = new NavigationHelpers(page);
    
    // Login as staff
    await authHelper.quickLogin('staff');
    await expect(page).toHaveURL(/\/staff/);
    
    // Take screenshot of main dashboard
    await page.screenshot({ path: 'test-artifacts/staff-dashboard-exploration.png', fullPage: true });
    
    console.log('📊 Staff dashboard loaded successfully');
    
    // Explore navigation options using standardized helper
    const navItems = await navHelper.getVisibleNavigationElements('staff');
    console.log(`📋 Found ${navItems.length} navigation items`);
    
    for (let i = 0; i < Math.min(navItems.length, 5); i++) {
      const item = navItems[i];
      try {
        const text = await item.textContent();
        const href = await item.getAttribute('href');
        console.log(`📌 Nav item ${i + 1}: "${text}" → ${href}`);
        
        if (text?.toLowerCase().includes('load') || href?.includes('load')) {
          console.log(`🎯 Found loads section: ${text} (${href})`);
          
          // Click to explore loads page
          await item.click();
          await page.waitForLoadState('networkidle');
          
          // Take screenshot of loads page
          await page.screenshot({ path: 'test-artifacts/loads-page-exploration.png', fullPage: true });
          
          // Look for route-related elements
          const routeElements = await page.locator('text="route", text="optimize", text="Route", text="Optimize"').all();
          console.log(`🛣️ Found ${routeElements.length} route-related elements on loads page`);
          
          for (const element of routeElements) {
            const routeText = await element.textContent();
            console.log(`   Route element: "${routeText}"`);
          }
          
          break;
        }
      } catch (e) {
        console.log(`⚠️ Could not access nav item ${i + 1}`);
      }
    }
    
    // Check for any existing loads
    const existingLoads = await page.locator('tr, .load-item, [data-testid*="load"]').count();
    console.log(`📦 Found ${existingLoads} potential load items`);
    
    // Look for create load button
    const createButtons = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').all();
    console.log(`➕ Found ${createButtons.length} create/add buttons`);
    
    for (const button of createButtons) {
      const buttonText = await button.textContent();
      console.log(`   Button: "${buttonText}"`);
    }
  });

  test('Test load creation process @exploration', async ({ page }) => {
    const authHelper = new AuthHelpers(page);
    
    await authHelper.quickLogin('staff');
    await expect(page).toHaveURL(/\/staff/);
    
    // Navigate to loads page
    try {
      await page.click('a:has-text("Load"), a[href*="/load"], nav a:has-text("Load")');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Successfully navigated to loads page');
      
      // Look for create load functionality
      const createLoadButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      
      if (await createLoadButton.isVisible()) {
        await createLoadButton.click();
        
        // Look for load creation form
        const form = page.locator('form, [role="dialog"], .modal');
        await expect(form).toBeVisible({ timeout: 10000 });
        
        // Take screenshot of load creation form
        await page.screenshot({ path: 'test-artifacts/load-creation-form.png' });
        
        console.log('✅ Load creation form displayed successfully');
        
        // Explore form fields
        const inputs = await page.locator('input, select, textarea').all();
        console.log(`📝 Found ${inputs.length} form fields`);
        
        for (const input of inputs) {
          const name = await input.getAttribute('name');
          const placeholder = await input.getAttribute('placeholder');
          const type = await input.getAttribute('type');
          console.log(`   Field: name="${name}" placeholder="${placeholder}" type="${type}"`);
        }
      } else {
        console.log('⚠️ No create load button found - may need to look elsewhere');
      }
      
    } catch (e) {
      console.log('⚠️ Could not navigate to loads page - trying alternative navigation');
      
      // Alternative: look for loads in main dashboard
      const dashboardLoads = await page.locator('text="load", text="Load"').all();
      console.log(`📊 Found ${dashboardLoads.length} load-related elements on dashboard`);
    }
  });
});