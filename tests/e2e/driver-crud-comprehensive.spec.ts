import { test, expect } from '@playwright/test';
import { ModalTestingUtils, RolePermissions } from './utils/modal-testing';

/**
 * 🚛 DRIVER ROLE: Comprehensive CRUD Testing
 * 
 * Tests driver-specific operations: load management, delivery workflows, route optimization
 * Validates driver sees distinct interface and proper permission enforcement
 */

test.describe('🚛 Driver Role - Complete CRUD Operations', () => {
  let modalUtils: ModalTestingUtils;

  test.beforeEach(async ({ page }) => {
    modalUtils = new ModalTestingUtils(page);
    
    // Login as driver user
    console.log('🔐 Logging in as driver user...');
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'driver@shipnorth.com');
    await page.fill('input[type="password"]', 'driver123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify driver portal access
    expect(page.url()).toContain('/driver');
    console.log('✅ Driver login successful');
  });

  test.describe('🚛 Load Management (Driver View)', () => {
    test('Driver can view assigned loads @crud @loads @driver', async ({ page }) => {
      console.log('👁️ Testing Driver Load View...');
      
      await page.goto('http://localhost:8849/driver/loads');
      await page.waitForLoadState('networkidle');
      
      // Check driver sees load list
      await expect(page.locator('h1:has-text("My Loads"), h2:has-text("Assigned Loads")')).toBeVisible();
      
      // Check load items are visible
      const loadItems = await page.locator('.load-item, tr[data-testid*="load"], .load-card').count();
      console.log(`📊 Driver sees ${loadItems} loads`);
      
      // Test view load details
      if (loadItems > 0) {
        const viewSuccess = await modalUtils.testViewWorkflow(
          '.load-item:first-child button:has-text("View"), tr:first-child button:has-text("Details")',
          ['Load Details', 'Package List', 'Route Information']
        );
        expect(viewSuccess).toBe(true);
      }
      
      console.log('✅ Driver load view functionality validated');
    });

    test('Driver can update load status @crud @loads @driver', async ({ page }) => {
      console.log('📝 Testing Driver Load Status Updates...');
      
      await page.goto('http://localhost:8849/driver/loads');
      await page.waitForLoadState('networkidle');
      
      // Look for status update functionality
      const statusButtons = [
        'button:has-text("Start Load")',
        'button:has-text("Complete")', 
        'button:has-text("In Progress")',
        'select[name="status"], [data-testid="status-select"]'
      ];
      
      let statusUpdateAvailable = false;
      for (const selector of statusButtons) {
        try {
          if (await page.locator(selector).isVisible()) {
            await page.click(selector);
            await page.waitForTimeout(1000);
            statusUpdateAvailable = true;
            console.log(`✅ Driver can update status via: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(statusUpdateAvailable).toBe(true);
      console.log('✅ Driver load status update functionality validated');
    });

    test('Driver cannot create or delete loads @permissions @security', async ({ page }) => {
      console.log('🛡️ Testing Driver Load Permission Restrictions...');
      
      await page.goto('http://localhost:8849/driver/loads');
      await page.waitForLoadState('networkidle');
      
      // Verify driver cannot see create/delete buttons
      const createButton = page.locator('button:has-text("Add Load"), button:has-text("New Load")');
      const deleteButtons = page.locator('button:has-text("Delete")');
      
      await expect(createButton).not.toBeVisible();
      console.log('✅ Driver correctly cannot create loads');
      
      // Delete buttons should either be hidden or disabled for drivers
      const deleteCount = await deleteButtons.count();
      if (deleteCount > 0) {
        // If delete buttons exist, they should be disabled
        for (let i = 0; i < deleteCount; i++) {
          const button = deleteButtons.nth(i);
          const isDisabled = await button.isDisabled();
          expect(isDisabled).toBe(true);
        }
        console.log('✅ Driver delete buttons properly disabled');
      } else {
        console.log('✅ Driver cannot see delete buttons (properly hidden)');
      }
    });
  });

  test.describe('📍 Route Management', () => {
    test('Driver can view and optimize routes @crud @routes @driver', async ({ page }) => {
      console.log('🗺️ Testing Driver Route Management...');
      
      await page.goto('http://localhost:8849/driver/routes');
      await page.waitForLoadState('networkidle');
      
      // Check route optimization interface
      await expect(page.locator('h1:has-text("Routes"), h2:has-text("Route Optimization")')).toBeVisible();
      
      // Test route interaction
      const routeActions = [
        'button:has-text("Optimize Route")',
        'button:has-text("Start Navigation")',
        '[data-testid="route-optimize"]'
      ];
      
      let routeInteractionAvailable = false;
      for (const selector of routeActions) {
        try {
          if (await page.locator(selector).isVisible()) {
            console.log(`✅ Driver can access: ${selector}`);
            routeInteractionAvailable = true;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(routeInteractionAvailable).toBe(true);
      console.log('✅ Driver route management functionality validated');
    });
  });

  test.describe('📦 Delivery Management', () => {
    test('Driver can manage deliveries @crud @deliveries @driver', async ({ page }) => {
      console.log('📦 Testing Driver Delivery Management...');
      
      await page.goto('http://localhost:8849/driver/deliveries');
      await page.waitForLoadState('networkidle');
      
      // Check delivery interface
      await expect(page.locator('h1:has-text("Deliveries"), h2:has-text("Package Deliveries")')).toBeVisible();
      
      // Test delivery actions
      const deliveryActions = [
        'button:has-text("Mark Delivered")',
        'button:has-text("Scan Package")',
        'button:has-text("Proof of Delivery")',
        '[data-testid="delivery-action"]'
      ];
      
      let deliveryActionAvailable = false;
      for (const selector of deliveryActions) {
        try {
          if (await page.locator(selector).isVisible()) {
            console.log(`✅ Driver can access: ${selector}`);
            deliveryActionAvailable = true;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(deliveryActionAvailable).toBe(true);
      console.log('✅ Driver delivery management functionality validated');
    });
  });

  test.describe('💰 Earnings Management', () => {
    test('Driver can view earnings and performance @crud @earnings @driver', async ({ page }) => {
      console.log('💰 Testing Driver Earnings View...');
      
      await page.goto('http://localhost:8849/driver/earnings');
      await page.waitForLoadState('networkidle');
      
      // Check earnings interface
      await expect(page.locator('h1:has-text("Earnings"), h2:has-text("Performance")')).toBeVisible();
      
      // Check earnings data elements
      const earningsElements = [
        'text=Total Earnings',
        'text=Deliveries Completed',
        'text=Performance Metrics',
        '[data-testid="earnings-summary"]'
      ];
      
      let earningsDataVisible = 0;
      for (const selector of earningsElements) {
        try {
          if (await page.locator(selector).isVisible()) {
            earningsDataVisible++;
            console.log(`✅ Driver can see: ${selector}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(earningsDataVisible).toBeGreaterThan(0);
      console.log('✅ Driver earnings functionality validated');
    });
  });

  test.describe('🎛️ Driver Portal Interface Validation', () => {
    test('Driver sees distinct driver interface @interface @driver', async ({ page }) => {
      console.log('🔍 Validating Driver Portal Interface Distinctiveness...');
      
      await page.goto('http://localhost:8849/driver');
      await page.waitForLoadState('networkidle');
      
      // Check driver-specific navigation (should NOT see staff elements)
      await expect(page.locator('text=Driver Dashboard, text=Driver Portal')).toBeVisible();
      
      // Driver should see driver-specific nav items
      const driverNavItems = [
        'text=My Loads',
        'text=Routes', 
        'text=Deliveries',
        'text=Earnings'
      ];
      
      for (const navItem of driverNavItems) {
        await expect(page.locator(navItem)).toBeVisible();
        console.log(`✅ Driver nav includes: ${navItem}`);
      }
      
      // Driver should NOT see staff-specific items  
      const staffOnlyItems = [
        'text=Customer Management',
        'text=Admin Panel',
        'text=System Settings',
        'text=User Management'
      ];
      
      for (const staffItem of staffOnlyItems) {
        await expect(page.locator(staffItem)).not.toBeVisible();
        console.log(`✅ Driver correctly cannot see: ${staffItem}`);
      }
      
      console.log('✅ Driver interface distinctiveness validated');
    });

    test('Driver cannot access staff/admin areas @permissions @security', async ({ page }) => {
      console.log('🛡️ Testing Driver Access Restrictions...');
      
      // Attempt to access staff areas
      await page.goto('http://localhost:8849/staff/customers');
      await page.waitForTimeout(2000);
      
      // Should be redirected away from staff area
      const currentUrl = page.url();
      const isRestricted = !currentUrl.includes('/staff/customers');
      
      expect(isRestricted).toBe(true);
      console.log(`✅ Driver access to staff areas properly restricted: ${currentUrl}`);
    });
  });
});