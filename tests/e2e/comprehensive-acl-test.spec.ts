import { test, expect } from '@playwright/test';
import { config } from './config';

/**
 * Comprehensive ACL Test Matrix
 * Tests all user types × all resources × all actions
 */

test.describe('🔒 Comprehensive ACL Permission Matrix', () => {
  
  // Test matrix: All combinations
  const userTypes = ['customer', 'staff', 'admin', 'driver'] as const;
  const resources = ['Package', 'Customer', 'Load', 'Invoice', 'User', 'Settings'] as const;
  const actions = ['create', 'read', 'update', 'delete', 'manage'] as const;

  // Expected permissions matrix
  const permissionMatrix = {
    customer: {
      Package: ['read'],
      Customer: ['read', 'update'], 
      Load: [],
      Invoice: ['read'],
      User: ['read', 'update'],
      Settings: []
    },
    driver: {
      Package: ['read'],
      Customer: [],
      Load: ['read', 'update'],
      Invoice: [],
      User: ['read', 'update'],
      Settings: []
    },
    staff: {
      Package: ['create', 'read', 'update', 'delete', 'manage'],
      Customer: ['create', 'read', 'update', 'delete', 'manage'],
      Load: ['create', 'read', 'update', 'delete', 'manage'],
      Invoice: ['create', 'read', 'update', 'delete', 'manage'],
      User: ['create', 'read', 'update', 'delete'],
      Settings: []
    },
    admin: {
      Package: ['create', 'read', 'update', 'delete', 'manage'],
      Customer: ['create', 'read', 'update', 'delete', 'manage'],
      Load: ['create', 'read', 'update', 'delete', 'manage'],
      Invoice: ['create', 'read', 'update', 'delete', 'manage'],
      User: ['create', 'read', 'update', 'delete', 'manage'],
      Settings: ['create', 'read', 'update', 'delete', 'manage']
    }
  };

  for (const userType of userTypes) {
    test(`${userType} permissions matrix validation @security`, async ({ page }) => {
      // Login as user type
      const credentials = {
        customer: { email: 'test@test.com', password: 'test123' },
        staff: { email: 'staff@shipnorth.com', password: 'staff123' },
        admin: { email: 'admin@shipnorth.com', password: 'admin123' },
        driver: { email: 'driver@shipnorth.com', password: 'driver123' }
      };

      const cred = credentials[userType];
      const response = await page.request.post(`${config.apiUrl}/auth/login`, {
        data: cred
      });
      expect(response.status()).toBe(200);

      const userData = await response.json();
      const token = userData.token || userData.accessToken;

      // Get user's permissions
      const permissionsResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(permissionsResponse.status()).toBe(200);

      const permissionsData = await permissionsResponse.json();
      const rules = permissionsData.rules;

      // Validate permissions match expected matrix
      for (const resource of resources) {
        const expectedActions = permissionMatrix[userType][resource];
        
        for (const action of actions) {
          const hasPermission = rules.some((rule: any) => 
            (rule.action === action || rule.action === 'manage') && 
            rule.subject === resource
          );

          const shouldHavePermission = expectedActions.includes(action) || expectedActions.includes('manage');

          expect(hasPermission).toBe(shouldHavePermission, 
            `${userType} should ${shouldHavePermission ? 'have' : 'not have'} ${action} permission on ${resource}`
          );
        }
      }
    });
  }

  test('Multi-role user combines permissions correctly @security', async ({ page }) => {
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'staff-driver@shipnorth.com', password: 'staff123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const token = userData.token || userData.accessToken;

    const permissionsResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const permissionsData = await permissionsResponse.json();
    const rules = permissionsData.rules;

    // Should have BOTH staff and driver permissions
    const hasStaffPermissions = rules.some((rule: any) => rule.action === 'manage' && rule.subject === 'Package');
    const hasDriverPermissions = rules.some((rule: any) => 
      rule.action === 'read' && rule.subject === 'Load' && rule.conditions?.driverId
    );

    expect(hasStaffPermissions).toBe(true);
    expect(hasDriverPermissions).toBe(true);
  });
});