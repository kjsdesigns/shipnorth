import { test, expect } from '@playwright/test';
import { config } from './config';

/**
 * ACL (Access Control List) Validation Tests
 * Tests the complete CASL-based permission system implementation
 */

test.describe('🔒 ACL Permission System Validation', () => {
  
  // Helper function for login
  async function loginAs(page: any, userType: 'customer' | 'staff' | 'admin' | 'driver' | 'staff-driver') {
    await page.goto('/login/');
    
    const credentials = {
      customer: { email: 'test@test.com', password: 'test123' },
      staff: { email: 'staff@shipnorth.com', password: 'staff123' },
      admin: { email: 'admin@shipnorth.com', password: 'admin123' },
      driver: { email: 'driver@shipnorth.com', password: 'driver123' },
      'staff-driver': { email: 'staff-driver@shipnorth.com', password: 'staff123' }
    };

    const cred = credentials[userType];
    await page.fill('input[name="email"], input[type="email"]', cred.email);
    await page.fill('input[name="password"], input[type="password"]', cred.password);
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for successful login
    await page.waitForURL(url => !url.pathname.includes('/login/'), { timeout: 10000 });
  }

  test('CASL permissions API returns valid rules @critical', async ({ page }) => {
    // Test staff user permissions
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'staff@shipnorth.com', password: 'staff123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const token = userData.token || userData.accessToken;

    // Test permissions endpoint
    const permissionsResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    expect(permissionsResponse.status()).toBe(200);
    const permissionsData = await permissionsResponse.json();
    
    expect(permissionsData.rules).toBeDefined();
    expect(Array.isArray(permissionsData.rules)).toBe(true);
    expect(permissionsData.availablePortals).toContain('staff');
    expect(permissionsData.currentPortal).toBeTruthy();
  });

  test('Multi-role user has correct permissions @core', async ({ page }) => {
    // Test staff-driver user 
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'staff-driver@shipnorth.com', password: 'staff123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const user = userData.user;
    
    // Verify multi-role structure
    expect(user.roles).toContain('staff');
    expect(user.roles).toContain('driver');
    expect(user.availablePortals).toContain('staff');
    expect(user.availablePortals).toContain('driver');

    // Test permissions include both roles
    const token = userData.token || userData.accessToken;
    const permissionsResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const permissionsData = await permissionsResponse.json();
    const rules = permissionsData.rules;
    
    // Should have staff permissions (manage packages)
    const hasStaffPermissions = rules.some((rule: any) => 
      rule.action === 'manage' && rule.subject === 'Package'
    );
    expect(hasStaffPermissions).toBe(true);
    
    // Should have driver permissions (read/update loads with conditions)
    const hasDriverPermissions = rules.some((rule: any) => 
      rule.action === 'read' && rule.subject === 'Load' && rule.conditions?.driverId
    );
    expect(hasDriverPermissions).toBe(true);
  });

  test('Portal switching works for multi-role users @core', async ({ page }) => {
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'staff-driver@shipnorth.com', password: 'staff123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const token = userData.token || userData.accessToken;

    // Test portal switching
    const switchResponse = await page.request.post(`${config.apiUrl}/auth/switch-portal`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { portal: 'driver' }
    });
    
    expect(switchResponse.status()).toBe(200);
    const switchData = await switchResponse.json();
    expect(switchData.user.lastUsedPortal).toBe('driver');
    expect(switchData.message).toContain('Successfully switched to driver portal');
  });

  test('Admin overlay permissions work correctly @admin', async ({ page }) => {
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'admin@shipnorth.com', password: 'admin123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const token = userData.token || userData.accessToken;

    const permissionsResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const permissionsData = await permissionsResponse.json();
    const rules = permissionsData.rules;
    
    // Admin should have manage permissions on all resources
    const hasManagePackages = rules.some((rule: any) => rule.action === 'manage' && rule.subject === 'Package');
    const hasManageUsers = rules.some((rule: any) => rule.action === 'manage' && rule.subject === 'User');
    const hasManageSettings = rules.some((rule: any) => rule.action === 'manage' && rule.subject === 'Settings');
    
    expect(hasManagePackages).toBe(true);
    expect(hasManageUsers).toBe(true);
    expect(hasManageSettings).toBe(true);
  });

  test('API endpoints return 403 for unauthorized access @security', async ({ page }) => {
    // Test customer trying to access staff endpoints
    const response = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: { email: 'test@test.com', password: 'test123' }
    });
    expect(response.status()).toBe(200);

    const userData = await response.json();
    const token = userData.token || userData.accessToken;

    // Test staff-only endpoints
    const customersResponse = await page.request.get(`${config.apiUrl}/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(customersResponse.status()).toBe(403);

    const settingsResponse = await page.request.get(`${config.apiUrl}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(settingsResponse.status()).toBe(403);
  });

  test('Permission system handles edge cases correctly @security', async ({ page }) => {
    // Test invalid token
    const invalidResponse = await page.request.get(`${config.apiUrl}/auth/permissions`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    expect(invalidResponse.status()).toBe(401);

    // Test missing authorization header
    const noAuthResponse = await page.request.get(`${config.apiUrl}/customers`);
    expect(noAuthResponse.status()).toBe(401);
  });
});