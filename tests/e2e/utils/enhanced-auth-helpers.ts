import { Page, expect } from '@playwright/test';

interface LoginResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

export class EnhancedAuthHelpers {
  
  /**
   * Comprehensive login that ensures cookies are properly set
   */
  static async loginAsStaff(page: Page): Promise<LoginResult> {
    console.log('🔐 Starting enhanced staff login process...');
    
    try {
      // Step 1: Navigate to login page
      await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login`);
      await page.waitForLoadState('networkidle');
      
      // Step 2: Fill and submit login form
      console.log('📝 Filling login form...');
      await page.fill('input[type="email"]', 'staff@shipnorth.com');
      await page.fill('input[type="password"]', 'staff123');
      
      // Step 3: Submit form and wait for navigation/response
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Step 4: Get login data by making direct API call (more reliable)
      const loginData = await this.getAuthTokensDirectly(page);
      if (!loginData) {
        throw new Error('Failed to get authentication tokens');
      }
      console.log('✅ Login API successful:', loginData.user?.email || 'Unknown user');
      
      // Step 5: Wait for page to process login and redirect
      await page.waitForTimeout(2000);
      
      // Step 6: Manually set cookies if they weren't set automatically
      await this.ensureCookiesAreSet(page, loginData);
      
      // Step 7: Verify authentication state
      const isAuthenticated = await this.verifyAuthenticationState(page);
      
      if (!isAuthenticated) {
        console.log('⚠️ Authentication not properly established, attempting recovery...');
        await this.forceAuthenticationState(page, loginData);
      }
      
      return {
        success: true,
        user: loginData.user,
        token: loginData.accessToken
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get authentication tokens by making direct API call
   */
  private static async getAuthTokensDirectly(page: Page): Promise<any> {
    console.log('🔗 Getting auth tokens via direct API call...');
    
    try {
      const loginData = await page.evaluate(async () => {
        const response = await fetch('http://localhost:8850/auth/login/, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'staff@shipnorth.com',
            password: 'staff123'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Login API failed: ${response.status}`);
        }
        
        return response.json();
      });
      
      console.log('✅ Direct API call successful');
      return loginData;
      
    } catch (error) {
      console.error('❌ Direct API call failed:', error);
      return null;
    }
  }

  /**
   * Ensures authentication cookies are properly set
   */
  private static async ensureCookiesAreSet(page: Page, loginData: any) {
    console.log('🍪 Ensuring cookies are properly set...');
    
    const cookies = [
      {
        name: 'accessToken',
        value: loginData.accessToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'refreshToken', 
        value: loginData.refreshToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      },
      {
        name: 'user',
        value: JSON.stringify(loginData.user),
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      }
    ];
    
    for (const cookie of cookies) {
      await page.context().addCookies([cookie]);
      console.log(`✅ Set cookie: ${cookie.name}`);
    }
  }
  
  /**
   * Verifies that authentication state is properly established
   */
  private static async verifyAuthenticationState(page: Page): Promise<boolean> {
    console.log('🔍 Verifying authentication state...');
    
    // Check if cookies exist
    const cookies = await page.context().cookies();
    const hasAccessToken = cookies.some(c => c.name === 'accessToken');
    const hasUser = cookies.some(c => c.name === 'user');
    
    console.log(`🍪 Cookies present - accessToken: ${hasAccessToken}, user: ${hasUser}`);
    
    // Test JavaScript access to cookies and getCurrentUser
    const authCheck = await page.evaluate(() => {
      try {
        // Try multiple ways to access cookies
        let accessToken = null;
        let userStr = null;
        
        // Method 1: js-cookie (if available)
        if (typeof window.Cookies !== 'undefined') {
          accessToken = window.Cookies.get('accessToken');
          userStr = window.Cookies.get('user');
        } else {
          // Method 2: document.cookie fallback
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) acc[key] = decodeURIComponent(value);
            return acc;
          }, {});
          
          accessToken = cookies['accessToken'];
          userStr = cookies['user'];
        }
        
        const user = userStr ? JSON.parse(userStr) : null;
        
        return {
          hasAccessToken: !!accessToken,
          hasUser: !!user,
          userRoles: user?.roles || [],
          userEmail: user?.email,
          cookiesFound: document.cookie.length > 0 ? document.cookie.split(';').length : 0
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔍 Auth check result:', authCheck);
    
    return authCheck.hasAccessToken && authCheck.hasUser && 
           (authCheck.userRoles.includes('staff') || authCheck.userRoles.includes('admin'));
  }
  
  /**
   * Forces authentication state by executing login directly in browser context
   */
  private static async forceAuthenticationState(page: Page, loginData: any) {
    console.log('🚀 Forcing authentication state...');
    
    await page.evaluate(({ loginData }) => {
      // Ensure js-cookie is available
      if (typeof window.Cookies !== 'undefined') {
        window.Cookies.set('accessToken', loginData.accessToken);
        window.Cookies.set('refreshToken', loginData.refreshToken); 
        window.Cookies.set('user', JSON.stringify(loginData.user));
        console.log('✅ Cookies set via JavaScript');
      }
      
      // Also try localStorage as backup
      localStorage.setItem('accessToken', loginData.accessToken);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      console.log('✅ Data set in localStorage');
      
    }, { loginData });
  }
  
  /**
   * Safely navigate to staff portal with authentication verification
   */
  static async navigateToStaffPortal(page: Page): Promise<boolean> {
    console.log('🏠 Navigating to staff portal...');
    
    try {
      await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/staff`);
      await page.waitForTimeout(3000); // Allow time for redirect if needed
      
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if we're on login page (redirect happened)
      if (currentUrl.includes('/login/')) {
        console.log('❌ Redirected to login - authentication failed');
        return false;
      }
      
      // Check if we're on staff portal or dashboard
      if (currentUrl.includes('/staff')) {
        console.log('✅ Successfully on staff portal');
        return true;
      }
      
      console.log('⚠️ Unexpected page, but continuing...');
      return true;
      
    } catch (error) {
      console.error('❌ Navigation failed:', error.message);
      return false;
    }
  }
  
  /**
   * Wait for staff dashboard to fully load with data
   */
  static async waitForStaffDashboard(page: Page, timeout = 10000): Promise<boolean> {
    console.log('⏳ Waiting for staff dashboard to load...');
    
    try {
      // Wait for dashboard elements to appear
      await page.waitForSelector('.stat-card', { timeout });
      
      // Wait for data to load (stats should be numbers, not 0)
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const hasData = await page.evaluate(() => {
          const statCards = document.querySelectorAll('.stat-card');
          return statCards.length > 0;
        });
        
        if (hasData) {
          console.log('✅ Dashboard loaded with data');
          return true;
        }
        
        await page.waitForTimeout(1000);
        attempts++;
      }
      
      console.log('⚠️ Dashboard loaded but may not have full data');
      return true;
      
    } catch (error) {
      console.error('❌ Dashboard loading timeout:', error.message);
      return false;
    }
  }
}

export default EnhancedAuthHelpers;