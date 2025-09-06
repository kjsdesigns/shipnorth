import { test, expect } from '@playwright/test';
import { ModalTestingUtils, CRUDTestConfigs, RolePermissions } from './utils/modal-testing';

/**
 * 👥 STAFF ROLE: Comprehensive CRUD Testing
 * 
 * Tests all Create, Read, Update, Delete operations for staff users
 * Validates role-based permissions and interface distinctions
 */

test.describe('🏢 Staff Role - Complete CRUD Operations', () => {
  let modalUtils: ModalTestingUtils;

  test.beforeEach(async ({ page }) => {
    modalUtils = new ModalTestingUtils(page);
    
    // Login as staff user
    console.log('🔐 Logging in as staff user...');
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify staff portal access
    expect(page.url()).toContain('/staff');
    console.log('✅ Staff login successful');
  });

  test.describe('📦 Package Management CRUD', () => {
    test('Staff can create packages @crud @packages', async ({ page }) => {
      console.log('🆕 Testing Package Creation by Staff...');
      
      // Navigate to packages page
      await page.goto('http://localhost:8849/staff/packages');
      await page.waitForLoadState('networkidle');
      
      // Test package creation workflow
      const createSuccess = await modalUtils.testCreateWorkflow(
        'button:has-text("Add Package"), button:has-text("New Package"), [data-testid="add-package"]',
        CRUDTestConfigs.Package.create.formData,
        CRUDTestConfigs.Package.create.successIndicator
      );
      
      expect(createSuccess).toBe(true);
      console.log('✅ Staff package creation workflow validated');
    });

    test('Staff can edit packages @crud @packages', async ({ page }) => {
      console.log('📝 Testing Package Editing by Staff...');
      
      await page.goto('http://localhost:8849/staff/packages');
      await page.waitForLoadState('networkidle');
      
      // Find first package in list and edit it
      const editSuccess = await modalUtils.testEditWorkflow(
        'tr:first-child button:has-text("Edit"), tr:first-child [data-testid="edit"], .package-item:first-child button:has-text("Edit")',
        CRUDTestConfigs.Package.edit.formChanges,
        CRUDTestConfigs.Package.edit.successIndicator
      );
      
      expect(editSuccess).toBe(true);
      console.log('✅ Staff package editing workflow validated');
    });

    test('Staff can delete packages @crud @packages', async ({ page }) => {
      console.log('🗑️ Testing Package Deletion by Staff...');
      
      await page.goto('http://localhost:8849/staff/packages');
      await page.waitForLoadState('networkidle');
      
      // Find package to delete and test delete workflow
      const deleteSuccess = await modalUtils.testDeleteWorkflow(
        'tr:first-child button:has-text("Delete"), tr:first-child [data-testid="delete"], .package-item:first-child button:has-text("Delete")',
        'Are you sure you want to delete this package?'
      );
      
      expect(deleteSuccess).toBe(true);
      console.log('✅ Staff package deletion workflow validated');
    });

    test('Staff can view package details @crud @packages', async ({ page }) => {
      console.log('👁️ Testing Package Details View by Staff...');
      
      await page.goto('http://localhost:8849/staff/packages');
      await page.waitForLoadState('networkidle');
      
      const viewSuccess = await modalUtils.testViewWorkflow(
        'tr:first-child button:has-text("View"), tr:first-child [data-testid="view"], .package-item:first-child button:has-text("View")',
        ['Package Details', 'Weight', 'Dimensions', 'Customer']
      );
      
      expect(viewSuccess).toBe(true);
      console.log('✅ Staff package view workflow validated');
    });
  });

  test.describe('👥 Customer Management CRUD', () => {
    test('Staff can create customers @crud @customers', async ({ page }) => {
      console.log('🆕 Testing Customer Creation by Staff...');
      
      await page.goto('http://localhost:8849/staff/customers');
      await page.waitForLoadState('networkidle');
      
      const createSuccess = await modalUtils.testCreateWorkflow(
        'button:has-text("Add Customer"), button:has-text("New Customer"), [data-testid="add-customer"]',
        CRUDTestConfigs.Customer.create.formData,
        CRUDTestConfigs.Customer.create.successIndicator
      );
      
      expect(createSuccess).toBe(true);
      console.log('✅ Staff customer creation workflow validated');
    });

    test('Staff can edit customers @crud @customers', async ({ page }) => {
      console.log('📝 Testing Customer Editing by Staff...');
      
      await page.goto('http://localhost:8849/staff/customers');
      await page.waitForLoadState('networkidle');
      
      const editSuccess = await modalUtils.testEditWorkflow(
        'tr:first-child button:has-text("Edit"), .customer-item:first-child [data-testid="edit"]',
        CRUDTestConfigs.Customer.edit.formChanges,
        CRUDTestConfigs.Customer.edit.successIndicator
      );
      
      expect(editSuccess).toBe(true);
      console.log('✅ Staff customer editing workflow validated');
    });

    test('Staff can delete customers @crud @customers', async ({ page }) => {
      console.log('🗑️ Testing Customer Deletion by Staff...');
      
      await page.goto('http://localhost:8849/staff/customers');
      await page.waitForLoadState('networkidle');
      
      const deleteSuccess = await modalUtils.testDeleteWorkflow(
        'tr:first-child button:has-text("Delete"), .customer-item:first-child [data-testid="delete"]',
        'Are you sure you want to delete this customer?'
      );
      
      expect(deleteSuccess).toBe(true);
      console.log('✅ Staff customer deletion workflow validated');
    });
  });

  test.describe('🚛 Load Management CRUD', () => {
    test('Staff can create loads @crud @loads', async ({ page }) => {
      console.log('🆕 Testing Load Creation by Staff...');
      
      await page.goto('http://localhost:8849/staff/loads');
      await page.waitForLoadState('networkidle');
      
      const createSuccess = await modalUtils.testCreateWorkflow(
        'button:has-text("Add Load"), button:has-text("New Load"), [data-testid="add-load"]',
        CRUDTestConfigs.Load.create.formData,
        CRUDTestConfigs.Load.create.successIndicator
      );
      
      expect(createSuccess).toBe(true);
      console.log('✅ Staff load creation workflow validated');
    });

    test('Staff can edit loads @crud @loads', async ({ page }) => {
      console.log('📝 Testing Load Editing by Staff...');
      
      await page.goto('http://localhost:8849/staff/loads');
      await page.waitForLoadState('networkidle');
      
      const editSuccess = await modalUtils.testEditWorkflow(
        'tr:first-child button:has-text("Edit"), .load-item:first-child [data-testid="edit"]',
        CRUDTestConfigs.Load.edit.formChanges,
        CRUDTestConfigs.Load.edit.successIndicator
      );
      
      expect(editSuccess).toBe(true);
      console.log('✅ Staff load editing workflow validated');
    });

    test('Staff can delete loads @crud @loads', async ({ page }) => {
      console.log('🗑️ Testing Load Deletion by Staff...');
      
      await page.goto('http://localhost:8849/staff/loads');
      await page.waitForLoadState('networkidle');
      
      const deleteSuccess = await modalUtils.testDeleteWorkflow(
        'tr:first-child button:has-text("Delete"), .load-item:first-child [data-testid="delete"]',
        'Are you sure you want to delete this load?'
      );
      
      expect(deleteSuccess).toBe(true);
      console.log('✅ Staff load deletion workflow validated');
    });
  });

  test.describe('🎛️ Staff Portal Interface Validation', () => {
    test('Staff sees correct interface and permissions @interface @permissions', async ({ page }) => {
      console.log('🔍 Validating Staff Portal Interface...');
      
      // Check staff portal elements are visible
      await page.goto('http://localhost:8849/staff');
      await page.waitForLoadState('networkidle');
      
      // Verify staff-specific navigation
      await expect(page.locator('text=Staff Dashboard')).toBeVisible();
      await expect(page.locator('nav a:has-text("Customers")')).toBeVisible();
      await expect(page.locator('nav a:has-text("Packages")')).toBeVisible();
      await expect(page.locator('nav a:has-text("Loads")')).toBeVisible();
      
      // Verify role-based permissions
      const staffPerms = RolePermissions.staff;
      const allowedOps = [];
      const restrictedOps = [];
      
      // Build permission lists based on role config
      if (staffPerms.customers.create) allowedOps.push('Add Customer');
      if (staffPerms.packages.create) allowedOps.push('Add Package');  
      if (staffPerms.loads.create) allowedOps.push('Add Load');
      
      if (!staffPerms.users.create) restrictedOps.push('Add User'); // Admin only
      
      const accessCorrect = await modalUtils.verifyRoleAccess('staff', allowedOps, restrictedOps);
      expect(accessCorrect).toBe(true);
      
      console.log('✅ Staff interface and permissions validated');
    });

    test('Staff cannot access admin-only functions @permissions @security', async ({ page }) => {
      console.log('🛡️ Testing Staff Permission Restrictions...');
      
      // Try to access admin-only areas
      await page.goto('http://localhost:8849/staff/admin');
      await page.waitForLoadState('networkidle');
      
      // Should either redirect away or show access denied
      const currentUrl = page.url();
      const isRestricted = currentUrl.includes('/login') || 
                          currentUrl.includes('unauthorized') || 
                          await page.locator('text=Access Denied, text=Forbidden').isVisible();
      
      expect(isRestricted).toBe(true);
      console.log('✅ Staff admin access properly restricted');
    });
  });
});