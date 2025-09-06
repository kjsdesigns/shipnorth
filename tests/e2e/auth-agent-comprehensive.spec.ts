/**
 * 🛡️ Comprehensive Authentication Agent Test Suite
 * 
 * Uses the Authentication Agent as single source of truth
 * Tests the bulletproof HTTP-only cookie authentication system
 */

import { test, expect } from '@playwright/test';
import { authAgent, DEMO_USERS } from '../../agents/auth-agent-helpers';

test.describe('🛡️ Authentication Agent - Comprehensive Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authentication Agent health check before each test
    console.log('🛡️ AUTH AGENT: Running pre-test health check...');
    await authAgent.healthCheck(page);
  });

  test('🔍 Authentication Infrastructure Health Check', async ({ page }) => {
    await test.step('API Health Check', async () => {
      await authAgent.healthCheck(page);
    });

    await test.step('Debug Auth System', async () => {
      await authAgent.debugAuth(page);
    });
  });

  test('🔐 All Demo Users - Login Flow Validation', async ({ page }) => {
    await test.step('Test All 4 Demo Users', async () => {
      await authAgent.testAllUsers(page);
    });
  });

  test('👤 Staff User - Complete Authentication Flow', async ({ page }) => {
    const staffUser = authAgent.getUserByRole('staff');
    
    await test.step('Staff Login', async () => {
      await authAgent.login(page, staffUser.email, staffUser.password);
    });

    await test.step('Validate Staff Portal Access', async () => {
      await authAgent.expectPortalAccess(page, staffUser.expectedPortal);
    });

    await test.step('Session Persistence Test', async () => {
      await page.reload();
      await authAgent.expectPortalAccess(page, staffUser.expectedPortal);
    });

    await test.step('Staff Logout', async () => {
      await authAgent.logout(page);
    });
  });

  test('👔 Admin User - Multi-Role Authentication', async ({ page }) => {
    const adminUser = authAgent.getUserByRole('admin');
    
    await test.step('Admin Login', async () => {
      await authAgent.login(page, adminUser.email, adminUser.password);
    });

    await test.step('Validate Admin Portal Access', async () => {
      await authAgent.expectPortalAccess(page, adminUser.expectedPortal);
    });

    await test.step('Admin Area Access Test', async () => {
      await page.goto('http://localhost:8849/staff/admin');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/staff/admin');
    });

    await test.step('Session Validation', async () => {
      await authAgent.validateSessionExists(page);
    });

    await test.step('Admin Logout', async () => {
      await authAgent.logout(page);
    });
  });

  test('🚛 Driver User - Mobile-Optimized Authentication', async ({ page }) => {
    const driverUser = authAgent.getUserByRole('driver');
    
    await test.step('Driver Login', async () => {
      await authAgent.login(page, driverUser.email, driverUser.password);
    });

    await test.step('Validate Driver Portal Access', async () => {
      await authAgent.expectPortalAccess(page, driverUser.expectedPortal);
    });

    await test.step('Driver Portal Navigation', async () => {
      await page.goto('http://localhost:8849/driver/loads');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/driver');
    });

    await test.step('Driver Logout', async () => {
      await authAgent.logout(page);
    });
  });

  test('👨‍💼 Customer User - Portal Authentication', async ({ page }) => {
    const customerUser = authAgent.getUserByRole('customer');
    
    await test.step('Customer Login', async () => {
      await authAgent.login(page, customerUser.email, customerUser.password);
    });

    await test.step('Validate Customer Portal Access', async () => {
      await authAgent.expectPortalAccess(page, customerUser.expectedPortal);
    });

    await test.step('Customer Portal Features', async () => {
      await page.goto('http://localhost:8849/portal');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/portal');
      
      // Check for customer-specific content
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('error');
    });

    await test.step('Customer Logout', async () => {
      await authAgent.logout(page);
    });
  });

  test('🔒 Session Security - HTTP-Only Cookie Validation', async ({ page }) => {
    const staffUser = authAgent.getUserByRole('staff');

    await test.step('Login and Validate Session Cookie', async () => {
      await authAgent.login(page, staffUser.email, staffUser.password);
      
      // Validate that session exists server-side
      await authAgent.validateSessionExists(page);
    });

    await test.step('Cross-Tab Session Persistence', async () => {
      // Open new tab - session should persist
      const newTab = await page.context().newPage();
      await newTab.goto('http://localhost:8849/staff');
      await newTab.waitForTimeout(2000);
      
      expect(newTab.url()).not.toContain('/login');
      await newTab.close();
    });

    await test.step('Session Logout Cleanup', async () => {
      await authAgent.logout(page);
      await authAgent.validateSessionCleared(page);
    });
  });

  test('🚫 Unauthorized Access Prevention', async ({ page }) => {
    await test.step('Protected Route Redirects to Login', async () => {
      await page.goto('http://localhost:8849/staff');
      
      // Should redirect to login for unauthorized access
      await page.waitForURL(/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    await test.step('API Endpoint Security', async () => {
      const response = await page.request.get('http://localhost:8850/auth/session');
      expect(response.status()).toBe(401);
    });
  });

  test('🔄 Authentication Flow - Login/Logout Cycle', async ({ page }) => {
    for (const user of DEMO_USERS) {
      await test.step(`Testing ${user.displayName} cycle`, async () => {
        console.log(`🔄 Testing complete auth cycle for ${user.displayName}`);
        
        // Login
        await authAgent.login(page, user.email, user.password);
        await authAgent.expectPortalAccess(page, user.expectedPortal);
        
        // Session validation
        await authAgent.validateSessionExists(page);
        
        // Logout
        await authAgent.logout(page);
        await authAgent.validateSessionCleared(page);
      });
    }
  });

  test('⚡ Quick Authentication Tests', async ({ page }) => {
    await test.step('Staff Quick Login', async () => {
      await authAgent.quickLogin(page, 'staff');
    });
    
    await test.step('Staff Logout', async () => {
      await authAgent.logout(page);
    });

    await test.step('Customer Quick Login', async () => {
      await authAgent.quickLogin(page, 'customer');
    });
    
    await test.step('Customer Logout', async () => {
      await authAgent.logout(page);
    });
  });

  test('🩺 Authentication Debug and Diagnostics', async ({ page }) => {
    await test.step('Run Authentication Diagnostics', async () => {
      await authAgent.debugAuth(page);
    });

    await test.step('Health Check Validation', async () => {
      await authAgent.healthCheck(page);
    });

    await test.step('Session State Analysis', async () => {
      // Test invalid session detection
      await authAgent.validateSessionCleared(page);
      
      // Test valid session after login
      await authAgent.quickLogin(page, 'staff');
      await authAgent.validateSessionExists(page);
      
      // Cleanup
      await authAgent.logout(page);
    });
  });

  test('🎯 Role-Based Access Control', async ({ page }) => {
    await test.step('Staff Can Access Staff Portal', async () => {
      await authAgent.quickLogin(page, 'staff');
      await authAgent.expectPortalAccess(page, '/staff');
      await authAgent.logout(page);
    });

    await test.step('Admin Can Access Admin Area', async () => {
      await authAgent.quickLogin(page, 'admin');
      await authAgent.expectPortalAccess(page, '/staff');
      
      // Admin should also access admin-specific areas
      await page.goto('http://localhost:8849/staff/admin');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/staff');
      
      await authAgent.logout(page);
    });

    await test.step('Driver Can Access Driver Portal', async () => {
      await authAgent.quickLogin(page, 'driver');
      await authAgent.expectPortalAccess(page, '/driver');
      await authAgent.logout(page);
    });

    await test.step('Customer Can Access Customer Portal', async () => {
      await authAgent.quickLogin(page, 'customer');
      await authAgent.expectPortalAccess(page, '/portal');
      await authAgent.logout(page);
    });
  });
});