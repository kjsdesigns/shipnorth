/**
 * 🛡️ Authentication Agent Helpers
 * SINGLE SOURCE OF TRUTH for all authentication testing
 * Replaces all other auth helpers to prevent confusion
 */

import { Page, expect } from '@playwright/test';

export interface AuthUser {
  email: string;
  password: string;
  role: 'staff' | 'admin' | 'driver' | 'customer';
  expectedPortal: string;
  displayName: string;
}

export const DEMO_USERS: AuthUser[] = [
  {
    email: 'staff@shipnorth.com',
    password: 'staff123',
    role: 'staff',
    expectedPortal: '/staff',
    displayName: 'Staff User'
  },
  {
    email: 'admin@shipnorth.com', 
    password: 'admin123',
    role: 'admin',
    expectedPortal: '/staff',
    displayName: 'Admin User'
  },
  {
    email: 'driver@shipnorth.com',
    password: 'driver123', 
    role: 'driver',
    expectedPortal: '/driver',
    displayName: 'Driver User'
  },
  {
    email: 'test@test.com',
    password: 'test123',
    role: 'customer', 
    expectedPortal: '/portal',
    displayName: 'Customer User'
  }
];

export class AuthAgent {
  private readonly baseUrl: string;
  private readonly apiUrl: string;

  constructor(baseUrl = 'http://localhost:8849', apiUrl = 'http://localhost:8850') {
    this.baseUrl = baseUrl;
    this.apiUrl = apiUrl;
  }

  /**
   * 🔐 Core Login Function
   * ALWAYS uses credentials: 'include' and validates session
   */
  async login(page: Page, email: string, password: string): Promise<void> {
    console.log(`🛡️ AUTH AGENT: Logging in ${email}`);
    
    // Navigate to login page
    await page.goto(`${this.baseUrl}/login/`);
    
    // Fill and submit login form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for redirect or portal page
    await page.waitForURL(/\/(staff|driver|portal|admin)/, { timeout: 10000 });
    
    // Validate session was created
    await this.validateSessionExists(page);
    
    console.log(`✅ AUTH AGENT: Login successful for ${email}`);
  }

  /**
   * 🚪 Core Logout Function
   * Ensures complete session cleanup
   */
  async logout(page: Page): Promise<void> {
    console.log('🛡️ AUTH AGENT: Logging out');
    
    // Try to find logout button/link
    try {
      await page.click('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
    } catch {
      // If no logout button, call API directly
      await this.apiLogout(page);
    }
    
    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Validate session was cleared
    await this.validateSessionCleared(page);
    
    console.log('✅ AUTH AGENT: Logout successful');
  }

  /**
   * 🎯 Validate Portal Access
   * Ensures user can access expected portal
   */
  async expectPortalAccess(page: Page, expectedPath: string): Promise<void> {
    console.log(`🛡️ AUTH AGENT: Validating portal access to ${expectedPath}`);
    
    // Navigate to expected portal
    await page.goto(`${this.baseUrl}${expectedPath}`);
    
    // Should not redirect to login
    await page.waitForTimeout(2000); // Give time for any redirects
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain(expectedPath);
    
    // Validate page loaded (not error state)
    await expect(page.locator('body')).not.toContainText('error');
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('500');
    
    console.log(`✅ AUTH AGENT: Portal access confirmed for ${expectedPath}`);
  }

  /**
   * 🔒 Test All Demo Users
   * Comprehensive authentication test for all users
   */
  async testAllUsers(page: Page): Promise<void> {
    console.log('🛡️ AUTH AGENT: Testing all demo users');
    
    for (const user of DEMO_USERS) {
      console.log(`Testing user: ${user.displayName} (${user.email})`);
      
      // Login
      await this.login(page, user.email, user.password);
      
      // Validate portal access
      await this.expectPortalAccess(page, user.expectedPortal);
      
      // Test session persistence (refresh page)
      await page.reload();
      await this.expectPortalAccess(page, user.expectedPortal);
      
      // Logout
      await this.logout(page);
      
      console.log(`✅ AUTH AGENT: ${user.displayName} test completed`);
    }
    
    console.log('🎉 AUTH AGENT: All users tested successfully');
  }

  /**
   * 🩺 Session Health Check
   * Validates session state via API
   */
  async validateSessionExists(page: Page): Promise<void> {
    const sessionValid = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8850/auth/session', {
          credentials: 'include'
        });
        return response.ok;
      } catch {
        return false;
      }
    });
    
    expect(sessionValid).toBe(true);
    console.log('✅ AUTH AGENT: Session validated');
  }

  /**
   * 🧹 Session Cleanup Validation
   * Ensures session was properly cleared
   */
  async validateSessionCleared(page: Page): Promise<void> {
    const sessionCleared = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8850/auth/session', {
          credentials: 'include'
        });
        return response.status === 401;
      } catch {
        return true; // If call fails, assume session is cleared
      }
    });
    
    expect(sessionCleared).toBe(true);
    console.log('✅ AUTH AGENT: Session cleanup validated');
  }

  /**
   * 🔌 API Direct Login
   * For testing or emergency scenarios
   */
  async apiLogin(page: Page, email: string, password: string): Promise<void> {
    const result = await page.evaluate(async ({ email, password }) => {
      try {
        const response = await fetch('http://localhost:8850/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Login failed: ${response.status} - ${error}`);
        }
        
        return await response.json();
      } catch (error) {
        throw new Error(`API Login failed: ${error}`);
      }
    }, { email, password });
    
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(email);
    
    console.log(`✅ AUTH AGENT: API login successful for ${email}`);
  }

  /**
   * 🔌 API Direct Logout
   * For cleanup or testing
   */
  async apiLogout(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await fetch('http://localhost:8850/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    });
    
    console.log('✅ AUTH AGENT: API logout completed');
  }

  /**
   * 🧪 Auth System Health Check
   * Comprehensive validation of auth infrastructure
   */
  async healthCheck(page: Page): Promise<void> {
    console.log('🛡️ AUTH AGENT: Running health check');
    
    // Check API connectivity
    const apiHealth = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8850/health');
        if (!response.ok) return false;
        const data = await response.json();
        return data.status === 'healthy';
      } catch {
        return false;
      }
    });
    
    expect(apiHealth).toBe(true);
    console.log('✅ API Health: OK');
    
    // Check frontend connectivity  
    await page.goto(`${this.baseUrl}/`);
    await expect(page.locator('body')).not.toContainText('error');
    console.log('✅ Frontend Health: OK');
    
    // Check session endpoint
    const sessionHealth = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8850/auth/session', {
          credentials: 'include'
        });
        return response.status === 401; // Expecting 401 for no session
      } catch {
        return false;
      }
    });
    
    expect(sessionHealth).toBe(true);
    console.log('✅ Session Endpoint: OK');
    
    console.log('🎉 AUTH AGENT: Health check passed');
  }

  /**
   * 🔍 Debug Authentication Issues
   * Detailed diagnostics for auth problems
   */
  async debugAuth(page: Page): Promise<void> {
    console.log('🛡️ AUTH AGENT: Running debug diagnostics');
    
    const diagnostics = await page.evaluate(async () => {
      const results = [];
      
      // Check cookie-parser
      try {
        const response = await fetch('http://localhost:8850/health');
        results.push(`API Response: ${response.status}`);
      } catch (error) {
        results.push(`API Error: ${error}`);
      }
      
      // Check session endpoint
      try {
        const sessionResponse = await fetch('http://localhost:8850/auth/session', {
          credentials: 'include'
        });
        results.push(`Session Status: ${sessionResponse.status}`);
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          results.push(`Session User: ${sessionData.user?.email || 'none'}`);
        }
      } catch (error) {
        results.push(`Session Error: ${error}`);
      }
      
      // Check cookies
      const cookies = document.cookie;
      results.push(`Browser Cookies: ${cookies || 'none'}`);
      
      return results;
    });
    
    diagnostics.forEach(result => console.log(`🔍 ${result}`));
  }

  /**
   * 🛠️ Get User by Role
   * Helper to get demo user by role
   */
  getUserByRole(role: 'staff' | 'admin' | 'driver' | 'customer'): AuthUser {
    const user = DEMO_USERS.find(u => u.role === role);
    if (!user) throw new Error(`No demo user found for role: ${role}`);
    return user;
  }

  /**
   * 🧪 Quick Login Test
   * Fast validation that a user can login
   */
  async quickLogin(page: Page, role: 'staff' | 'admin' | 'driver' | 'customer'): Promise<void> {
    const user = this.getUserByRole(role);
    await this.login(page, user.email, user.password);
    await this.expectPortalAccess(page, user.expectedPortal);
  }
}

// Export singleton instance
export const authAgent = new AuthAgent();

// Export for easy importing
export default authAgent;