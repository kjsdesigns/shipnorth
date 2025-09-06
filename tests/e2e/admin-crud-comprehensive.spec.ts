import { test, expect } from '@playwright/test';
import { ModalTestingUtils, RolePermissions } from './utils/modal-testing';

/**
 * 👑 ADMIN ROLE: Comprehensive CRUD Testing
 * 
 * Tests admin-specific operations: user management, system settings, full data access
 * Validates admin sees enhanced interface with system management capabilities
 */

test.describe('👑 Admin Role - Complete CRUD Operations', () => {
  let modalUtils: ModalTestingUtils;

  test.beforeEach(async ({ page }) => {
    modalUtils = new ModalTestingUtils(page);
    
    // Login as admin user
    console.log('🔐 Logging in as admin user...');
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify admin portal access (should go to staff portal with admin privileges)
    expect(page.url()).toContain('/staff');
    console.log('✅ Admin login successful');
  });

  test.describe('👤 User Management CRUD', () => {
    test('Admin can create users @crud @users @admin', async ({ page }) => {
      console.log('🆕 Testing User Creation by Admin...');
      
      await page.goto('http://localhost:8849/staff/admin/users');
      await page.waitForLoadState('networkidle');
      
      const createUserSuccess = await modalUtils.testCreateWorkflow(
        'button:has-text("Add User"), button:has-text("Create User"), [data-testid="add-user"]',
        {
          email: 'newstaff@shipnorth.com',
          firstName: 'New',
          lastName: 'Staff',
          role: 'staff',
          password: 'temp123!'
        },
        'User created successfully'
      );
      
      expect(createUserSuccess).toBe(true);
      console.log('✅ Admin user creation workflow validated');
    });

    test('Admin can edit user roles and permissions @crud @users @admin', async ({ page }) => {
      console.log('📝 Testing User Role Management by Admin...');
      
      await page.goto('http://localhost:8849/staff/admin/users');
      await page.waitForLoadState('networkidle');
      
      const editUserSuccess = await modalUtils.testEditWorkflow(
        'tr:first-child button:has-text("Edit"), .user-item:first-child [data-testid="edit"]',
        {
          role: 'driver',
          status: 'active'
        },
        'User updated successfully'
      );
      
      expect(editUserSuccess).toBe(true);
      console.log('✅ Admin user role management validated');
    });

    test('Admin can deactivate/delete users @crud @users @admin', async ({ page }) => {
      console.log('🗑️ Testing User Deletion by Admin...');
      
      await page.goto('http://localhost:8849/staff/admin/users');
      await page.waitForLoadState('networkidle');
      
      const deleteUserSuccess = await modalUtils.testDeleteWorkflow(
        'tr:first-child button:has-text("Delete"), .user-item:first-child [data-testid="delete"]',
        'Are you sure you want to delete this user?'
      );
      
      expect(deleteUserSuccess).toBe(true);
      console.log('✅ Admin user deletion workflow validated');
    });
  });

  test.describe('⚙️ System Settings Management', () => {
    test('Admin can manage system settings @crud @settings @admin', async ({ page }) => {
      console.log('⚙️ Testing System Settings Management...');
      
      await page.goto('http://localhost:8849/staff/admin/settings');
      await page.waitForLoadState('networkidle');
      
      // Check settings interface
      await expect(page.locator('h1:has-text("Settings"), h2:has-text("System Settings")')).toBeVisible();
      
      // Test settings modification
      const settingsElements = [
        'input[name*="notification"], [data-testid*="setting"]',
        'button:has-text("Save Settings"), button:has-text("Update")'
      ];
      
      let settingsAvailable = false;
      for (const selector of settingsElements) {
        try {
          if (await page.locator(selector).isVisible()) {
            console.log(`✅ Admin settings interface includes: ${selector}`);
            settingsAvailable = true;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(settingsAvailable).toBe(true);
      console.log('✅ Admin system settings functionality validated');
    });
  });

  test.describe('📊 Analytics and Reporting', () => {
    test('Admin can access system analytics @crud @analytics @admin', async ({ page }) => {
      console.log('📊 Testing Admin Analytics Access...');
      
      await page.goto('http://localhost:8849/staff/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Check analytics interface
      const analyticsElements = [
        'text=Analytics, text=Dashboard',
        'text=Revenue, text=Performance',
        '.chart, .graph, [data-testid*="chart"]',
        'text=Export Report'
      ];
      
      let analyticsVisible = 0;
      for (const element of analyticsElements) {
        try {
          if (await page.locator(element).isVisible()) {
            analyticsVisible++;
            console.log(`✅ Admin analytics includes: ${element}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(analyticsVisible).toBeGreaterThan(0);
      console.log('✅ Admin analytics functionality validated');
    });
  });

  test.describe('🔍 Audit and Monitoring', () => {
    test('Admin can access audit logs @crud @audit @admin', async ({ page }) => {
      console.log('🔍 Testing Admin Audit Log Access...');
      
      await page.goto('http://localhost:8849/staff/audit');
      await page.waitForLoadState('networkidle');
      
      // Check audit interface
      const auditElements = [
        'text=Audit Log, text=System Activity',
        'text=User Actions',
        '.audit-entry, tr[data-testid*="audit"]'
      ];
      
      let auditVisible = false;
      for (const element of auditElements) {
        try {
          if (await page.locator(element).isVisible()) {
            console.log(`✅ Admin audit interface includes: ${element}`);
            auditVisible = true;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(auditVisible).toBe(true);
      console.log('✅ Admin audit functionality validated');
    });
  });

  test.describe('🏢 Full Data Access (Admin Privileges)', () => {
    test('Admin can access all customer data @crud @customers @admin', async ({ page }) => {
      console.log('👥 Testing Admin Customer Data Access...');
      
      await page.goto('http://localhost:8849/staff/customers');
      await page.waitForLoadState('networkidle');
      
      // Admin should see all customers, not just their own
      const customerList = await page.locator('.customer-item, tr[data-testid*="customer"]').count();
      console.log(`📊 Admin sees ${customerList} customers`);
      
      expect(customerList).toBeGreaterThan(0);
      
      // Admin should see customer management actions
      const adminCustomerActions = [
        'button:has-text("Add Customer")',
        'button:has-text("Edit")',
        'button:has-text("Delete")',
        'button:has-text("View Details")'
      ];
      
      let adminActionsAvailable = 0;
      for (const action of adminCustomerActions) {
        try {
          if (await page.locator(action).isVisible()) {
            adminActionsAvailable++;
            console.log(`✅ Admin customer action available: ${action}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(adminActionsAvailable).toBeGreaterThan(0);
      console.log('✅ Admin customer data access validated');
    });

    test('Admin can access all package data @crud @packages @admin', async ({ page }) => {
      console.log('📦 Testing Admin Package Data Access...');
      
      await page.goto('http://localhost:8849/staff/packages');
      await page.waitForLoadState('networkidle');
      
      // Admin should see all packages
      const packageList = await page.locator('.package-item, tr[data-testid*="package"]').count();
      console.log(`📊 Admin sees ${packageList} packages`);
      
      expect(packageList).toBeGreaterThan(0);
      console.log('✅ Admin package data access validated');
    });
  });

  test.describe('🎛️ Admin Portal Interface Validation', () => {
    test('Admin sees enhanced interface with system management @interface @admin', async ({ page }) => {
      console.log('🔍 Validating Admin Enhanced Interface...');
      
      await page.goto('http://localhost:8849/staff');
      await page.waitForLoadState('networkidle');
      
      // Admin should see all staff features PLUS admin features
      const adminEnhancements = [
        'text=Admin, text=Administration',
        'nav a[href*="admin"], a:has-text("Admin Panel")',
        'text=User Management',
        'text=System Settings'
      ];
      
      let adminFeaturesVisible = 0;
      for (const feature of adminEnhancements) {
        try {
          if (await page.locator(feature).isVisible()) {
            adminFeaturesVisible++;
            console.log(`✅ Admin interface includes: ${feature}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(adminFeaturesVisible).toBeGreaterThan(0);
      console.log('✅ Admin enhanced interface validated');
    });

    test('Admin has access to all portal types @permissions @admin', async ({ page }) => {
      console.log('🔓 Testing Admin Universal Access...');
      
      // Admin should be able to access all portal areas
      const accessibleAreas = [
        'http://localhost:8849/staff',
        'http://localhost:8849/staff/admin',
        'http://localhost:8849/staff/customers',
        'http://localhost:8849/staff/packages',
        'http://localhost:8849/staff/loads'
      ];
      
      for (const url of accessibleAreas) {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const hasAccess = !currentUrl.includes('/login') && 
                          !currentUrl.includes('unauthorized') &&
                          !await page.locator('text=Access Denied').isVisible();
        
        expect(hasAccess).toBe(true);
        console.log(`✅ Admin has access to: ${url}`);
      }
      
      console.log('✅ Admin universal access validated');
    });
  });
});