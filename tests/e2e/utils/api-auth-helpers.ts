import { Page, BrowserContext } from '@playwright/test';

/**
 * API-first authentication that bypasses frontend complexity
 * Uses real API tokens and sets them properly for frontend consumption
 */
export class ApiAuthHelpers {
  
  static async authenticateViaAPI(role: 'staff' | 'customer' | 'driver' | 'admin'): Promise<any> {
    console.log(`🔗 Getting real API token for ${role}...`);
    
    const credentials = {
      staff: { email: 'staff@shipnorth.com', password: 'staff123' },
      customer: { email: 'test@test.com', password: 'test123' },
      driver: { email: 'driver@shipnorth.com', password: 'driver123' },
      admin: { email: 'admin@shipnorth.com', password: 'admin123' }
    };
    
    const cred = credentials[role];
    
    try {
      const response = await fetch('http://localhost:8850/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      
      if (!response.ok) {
        throw new Error(`API login failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Got real API token for ${role}: ${data.user?.email}`);
      return data;
      
    } catch (error) {
      console.error(`❌ API authentication failed for ${role}:`, error);
      throw error;
    }
  }
  
  static async setAuthStateInBrowser(page: Page, authData: any) {
    console.log('🍪 Setting authenticated state in browser...');
    
    // Set cookies using Playwright's proper API
    await page.context().addCookies([
      {
        name: 'user',
        value: JSON.stringify(authData.user),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'accessToken', 
        value: authData.accessToken || authData.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'refreshToken',
        value: authData.refreshToken || authData.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      }
    ]);
    
    // Try localStorage but don't fail if blocked by security
    try {
      await page.evaluate((data) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.accessToken || data.token);
          localStorage.setItem('accessToken', data.accessToken || data.token);
          console.log('✅ localStorage auth state set');
        }
      }, authData);
    } catch (error) {
      console.log('⚠️ localStorage blocked, using cookies only');
    }
    
    console.log('✅ Authentication state established (cookies + localStorage if available)');
  }
  
  static async loginAndNavigate(page: Page, role: 'staff' | 'customer' | 'driver' | 'admin') {
    console.log(`🎯 API-first login as ${role}...`);
    
    // Step 1: Get real API authentication
    const authData = await this.authenticateViaAPI(role);
    
    // Step 2: Set authentication state in browser 
    await this.setAuthStateInBrowser(page, authData);
    
    // Step 3: Navigate to appropriate portal with trailing slash
    const portalUrls = {
      customer: '/portal/',
      staff: '/staff/',
      driver: '/driver/',
      admin: '/staff/'  // Admin goes to staff portal
    };
    
    const targetUrl = portalUrls[role];
    console.log(`🏠 Navigating to ${role} portal: ${targetUrl}`);
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}${targetUrl}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    // Verify we're not on login page
    if (finalUrl.includes('/login')) {
      console.warn(`⚠️ Still on login page after auth setup for ${role}`);
      return false;
    }
    
    console.log(`✅ Successfully authenticated and navigated to ${role} portal`);
    return true;
  }
  
  /**
   * Parallel authentication setup for multiple users
   */
  static async setupMultipleUsers(contexts: { page: Page, role: 'staff' | 'customer' | 'driver' | 'admin' }[]) {
    console.log('🚀 Setting up multiple authenticated users in parallel...');
    
    const authPromises = contexts.map(async ({ page, role }) => {
      try {
        const success = await this.loginAndNavigate(page, role);
        return { role, success, page };
      } catch (error) {
        console.error(`❌ Failed to setup ${role}:`, error);
        return { role, success: false, page, error };
      }
    });
    
    const results = await Promise.all(authPromises);
    const successful = results.filter(r => r.success);
    
    console.log(`✅ Successfully authenticated ${successful.length}/${contexts.length} users`);
    return results;
  }
}

export default ApiAuthHelpers;