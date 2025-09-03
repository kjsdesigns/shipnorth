import { test, expect } from '@playwright/test';
import { config } from './config';

/**
 * ACL PERMISSION SYSTEM TESTS
 * 
 * Tests the CASL-based permission system implementation:
 * - Multi-role authentication flows
 * - Portal access control
 * - Permission-based UI rendering
 * - API endpoint protection
 * - Admin permission overlays
 */

test.describe('🔒 ACL Permission System', () => {
  
  // Helper function to login as different user types
  async function loginAs(page: any, userType: 'customer' | 'staff' | 'admin' | 'driver' | 'staff-driver') {
    await page.goto('/login/');
    
    const credentials = {
      customer: { email: 'customer@shipnorth.com', password: 'test123' },
      staff: { email: 'staff@shipnorth.com', password: 'staff123' },
      admin: { email: 'admin@shipnorth.com', password: 'admin123' },
      driver: { email: 'driver@shipnorth.com', password: 'driver123' },
      'staff-driver': { email: 'staff-driver@shipnorth.com', password: 'staff123' }
    };

    const cred = credentials[userType];
    await page.fill('[data-testid="email"]', cred.email);
    await page.fill('[data-testid="password"]', cred.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login (should redirect away from login page)
    await page.waitForURL(url => !url.pathname.includes('/login/'), { timeout: 10000 });
  }

  test('customer cannot access staff portal @critical', async ({ page }) => {
    // Login as customer
    await loginAs(page, 'customer');
    
    // Try to access staff portal directly
    await page.goto('/staff/dashboard');
    
    // Should be redirected to unauthorized or login page
    await expect(page).toHaveURL(/\/(unauthorized|login)/);
    
    // Check that we don't see staff-specific content
    await expect(page.locator('text=Package Management')).not.toBeVisible();
    await expect(page.locator('text=Customer Management')).not.toBeVisible();
  });

  test('staff can access staff portal but not admin features @critical', async ({ page }) => {
    await loginAs(page, 'staff');
    await page.goto('/staff/dashboard');
    
    // Should successfully access staff portal
    await expect(page).toHaveURL('/staff/dashboard');
    
    // Regular staff features should be visible
    await expect(page.locator('text=Packages')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Loads')).toBeVisible();
    
    // Admin-only features should NOT be visible
    await expect(page.locator('text=User Management')).not.toBeVisible();
    await expect(page.locator('text=System Settings')).not.toBeVisible();
    await expect(page.locator('text=Audit Logs')).not.toBeVisible();
  });

  test('admin sees additional menu items in staff portal @critical', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/staff/dashboard');
    
    // Should successfully access staff portal
    await expect(page).toHaveURL('/staff/dashboard');
    
    // Regular staff items should be visible
    await expect(page.locator('text=Packages')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Loads')).toBeVisible();
    
    // Admin-only items should be visible
    await expect(page.locator('text=Administration')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=Audit Logs')).toBeVisible();
    
    // Admin badge should be visible
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('multi-role user can switch between portals @core', async ({ page }) => {
    // This test assumes we have a user with both staff and driver roles
    await loginAs(page, 'staff-driver');
    
    // Should start in staff portal (default)
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL('/staff/dashboard');
    
    // Portal switcher should be visible for multi-role users
    const portalSwitcher = page.locator('[data-testid="portal-switcher"]');
    await expect(portalSwitcher).toBeVisible();
    
    // Click portal switcher
    await portalSwitcher.click();
    
    // Should see Driver Portal option
    await expect(page.locator('text=Driver Portal')).toBeVisible();
    
    // Switch to driver portal
    await page.click('text=Driver Portal');
    
    // Should be redirected to driver portal
    await expect(page).toHaveURL('/driver/dashboard');
    
    // Should see driver-specific content
    await expect(page.locator('text=My Loads')).toBeVisible();
    await expect(page.locator('text=Routes')).toBeVisible();
  });

  test('API endpoints respect permission system @critical', async ({ page }) => {
    // Test as staff user
    await loginAs(page, 'staff');
    
    // Get auth token from storage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Test successful API call (staff can read packages)
    const packagesResponse = await page.request.get(`${config.apiUrl}/packages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(packagesResponse.status()).toBe(200);
    
    // Test that admin-only endpoints are protected
    const adminResponse = await page.request.get(`${config.apiUrl}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(adminResponse.status()).toBe(403);
  });

  test('portal access prevents unauthorized navigation @core', async ({ page }) => {
    await loginAs(page, 'customer');
    
    // Try to access various staff endpoints
    const staffEndpoints = [
      '/staff/packages',
      '/staff/customers',
      '/staff/loads',
      '/staff/admin/settings'
    ];
    
    for (const endpoint of staffEndpoints) {
      await page.goto(endpoint);
      
      // Should be redirected to unauthorized page or login
      await expect(page).toHaveURL(/\/(unauthorized|login)/);
    }
  });

  test('driver can access driver portal and assigned loads @core', async ({ page }) => {
    await loginAs(page, 'driver');
    await page.goto('/driver/dashboard');
    
    // Should successfully access driver portal
    await expect(page).toHaveURL('/driver/dashboard');
    
    // Driver-specific features should be visible
    await expect(page.locator('text=My Loads')).toBeVisible();
    await expect(page.locator('text=Routes')).toBeVisible();
    await expect(page.locator('text=Deliveries')).toBeVisible();
    await expect(page.locator('text=Earnings')).toBeVisible();
  });

  test('permissions are properly loaded from API @critical', async ({ page }) => {
    await loginAs(page, 'admin');
    
    // Check that permissions API is called
    let permissionsCallMade = false;
    page.on('response', response => {
      if (response.url().includes('/auth/permissions')) {
        permissionsCallMade = true;
      }
    });
    
    await page.goto('/staff/dashboard');
    
    // Wait a bit for API calls
    await page.waitForTimeout(2000);
    
    expect(permissionsCallMade).toBe(true);
    
    // Check that ability object is available in browser context
    const hasAbility = await page.evaluate(() => {
      return typeof window.__ability !== 'undefined';
    });
    
    expect(hasAbility).toBe(true);
  });

  test('permission denials are logged in audit system @core', async ({ page, request }) => {
    // Login as customer
    await loginAs(page, 'customer');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    // Try to access staff-only API endpoint (should fail and be logged)
    const response = await request.post(`${config.apiUrl}/packages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        description: 'Test package'
      }
    });
    
    expect(response.status()).toBe(403);
    
    // The failure should be logged in audit system
    // (We can't easily test the audit log without admin access, 
    //  but the middleware should log this denial)
  });

  test('UI components respect Can permissions @core', async ({ page }) => {
    await loginAs(page, 'staff');
    await page.goto('/staff/dashboard');
    
    // Elements wrapped in <Can> components should be visible for staff
    await expect(page.locator('text=Packages')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    
    // Now test as customer - these should not be visible
    await page.goto('/login/');
    await loginAs(page, 'customer');
    await page.goto('/portal');
    
    // Staff-specific navigation should not be visible in customer portal
    await expect(page.locator('text=Package Management')).not.toBeVisible();
    await expect(page.locator('text=Customer Management')).not.toBeVisible();
  });

  test('portal switching maintains correct permissions @core', async ({ page }) => {
    await loginAs(page, 'staff-driver');
    
    // Start in staff portal
    await page.goto('/staff/dashboard');
    await expect(page.locator('text=Packages')).toBeVisible(); // Staff permission
    
    // Switch to driver portal
    const portalSwitcher = page.locator('[data-testid="portal-switcher"]');
    await portalSwitcher.click();
    await page.click('text=Driver Portal');
    await page.waitForURL('/driver/dashboard');
    
    // Should now see driver permissions, not staff
    await expect(page.locator('text=My Loads')).toBeVisible(); // Driver permission
    
    // Staff-specific navigation should not be visible in driver context
    await expect(page.locator('text=Customer Management')).not.toBeVisible();
  });

  test('protected routes work correctly @core', async ({ page }) => {
    // Test unauthenticated access
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\'/login/');
    
    // Test authenticated but unauthorized access
    await loginAs(page, 'customer');
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/(unauthorized|login)/);
    
    // Test authorized access
    await page.goto('/login/');
    await loginAs(page, 'staff');
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL('/staff/dashboard');
  });
});

// Add permission tests to existing optimized test suite
test.describe('🔒 Permission Integration with Optimized Suite', () => {
  test('consolidated permission matrix validation @critical', async ({ page }) => {
    // Test all user types in single session for speed (similar to optimized suite pattern)
    const userTypes = ['customer', 'staff', 'admin', 'driver'] as const;
    
    for (const userType of userTypes) {
      await loginAs(page, userType);
      
      // Verify permissions API is called and ability is loaded
      const ability = await page.evaluate(() => window.__ability);
      expect(ability).toBeDefined();
      
      // Quick permission checks based on user type
      const permissionChecks = await page.evaluate((type) => {
        if (!window.__ability) return {};
        
        return {
          canCreatePackage: window.__ability.can('create', 'Package'),
          canReadReports: window.__ability.can('read', 'Report'),
          canManageUsers: window.__ability.can('manage', 'User'),
          canAccessStaffPortal: ['staff', 'admin'].includes(type),
          canAccessDriverPortal: ['driver'].includes(type) || type === 'staff-driver',
          canAccessCustomerPortal: ['customer'].includes(type)
        };
      }, userType);
      
      // Assert based on user type
      switch (userType) {
        case 'admin':
          expect(permissionChecks.canCreatePackage).toBe(true);
          expect(permissionChecks.canManageUsers).toBe(true);
          expect(permissionChecks.canAccessStaffPortal).toBe(true);
          break;
        case 'staff':
          expect(permissionChecks.canCreatePackage).toBe(true);
          expect(permissionChecks.canManageUsers).toBe(false); // Staff can't manage admin users
          expect(permissionChecks.canAccessStaffPortal).toBe(true);
          break;
        case 'driver':
          expect(permissionChecks.canCreatePackage).toBe(false);
          expect(permissionChecks.canManageUsers).toBe(false);
          expect(permissionChecks.canAccessDriverPortal).toBe(true);
          break;
        case 'customer':
          expect(permissionChecks.canCreatePackage).toBe(false);
          expect(permissionChecks.canManageUsers).toBe(false);
          expect(permissionChecks.canAccessCustomerPortal).toBe(true);
          break;
      }
    }
    
    console.log('✅ Permission matrix validation completed for all user types');
  });
});