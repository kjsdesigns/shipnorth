import { Page, BrowserContext } from '@playwright/test';

/**
 * Advanced Session Injection System
 * Injects valid server-side sessions directly into browser context
 */
export class SessionInjectionSystem {
  
  /**
   * Create and inject a valid server session
   */
  static async injectServerSession(page: Page, role: 'staff' | 'customer' | 'driver' | 'admin') {
    console.log(`🔬 SESSION INJECTION: Creating ${role} session...`);
    
    // Step 1: Generate real session token from API
    const sessionToken = await this.generateValidSessionToken(role);
    
    if (!sessionToken) {
      console.log('⚠️ SESSION INJECTION: Falling back to mock session');
      return await this.injectMockSession(page, role);
    }
    
    // Step 2: Inject session cookie
    await page.context().addCookies([{
      name: 'session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false,
      sameSite: 'Lax'
    }]);
    
    console.log(`✅ SESSION INJECTION: Valid ${role} session injected`);
    return true;
  }
  
  /**
   * Generate valid session token using real API with enhanced cookie extraction
   */
  private static async generateValidSessionToken(role: string): Promise<string | null> {
    try {
      const credentials = {
        staff: { email: 'staff@shipnorth.com', password: 'staff123' },
        customer: { email: 'test@test.com', password: 'test123' },
        driver: { email: 'driver@shipnorth.com', password: 'driver123' },
        admin: { email: 'admin@shipnorth.com', password: 'admin123' }
      };
      
      const cred = credentials[role as keyof typeof credentials];
      
      // Use the same API endpoint that the frontend uses (through proxy)
      const response = await fetch('http://localhost:8849/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-test-mode': 'true',
          'x-test-role': role
        },
        body: JSON.stringify(cred),
        credentials: 'include' // Important for cookie handling
      });
      
      if (response.ok) {
        // Extract session cookie from set-cookie header
        const setCookieHeaders = response.headers.getSetCookie?.() || 
                                response.headers.get('set-cookie')?.split(', ') || [];
        
        for (const cookie of setCookieHeaders) {
          const sessionMatch = cookie.match(/session=([^;]+)/);
          if (sessionMatch) {
            console.log(`✅ SESSION INJECTION: Real session token generated for ${role}`);
            return sessionMatch[1];
          }
        }
        
        // Also check response body for additional session info
        const responseData = await response.json();
        console.log(`📝 SESSION INJECTION: Login response for ${role}:`, 
                    responseData.user ? 'User data present' : 'No user data');
        
        return null;
      }
      
      console.log(`⚠️ SESSION INJECTION: Login failed for ${role} - Status: ${response.status}`);
      return null;
      
    } catch (error) {
      console.error(`❌ SESSION INJECTION: Token generation failed for ${role}:`, error);
      return null;
    }
  }
  
  /**
   * Inject mock session when real session unavailable
   */
  private static async injectMockSession(page: Page, role: string) {
    console.log(`🎭 SESSION INJECTION: Using mock session for ${role}`);
    
    // Create mock JWT-style token (for development only)
    const mockTokenData = {
      id: `${role}-test-id`,
      email: `${role}@shipnorth.com`,
      role: role,
      roles: [role],
      firstName: 'Test',
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const mockToken = btoa(JSON.stringify(mockTokenData));
    
    await page.context().addCookies([{
      name: 'session',
      value: mockToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }]);
    
    console.log(`✅ SESSION INJECTION: Mock session created for ${role}`);
    return true;
  }
  
  /**
   * Comprehensive portal access with enhanced session injection and validation
   */
  static async accessPortalWithSession(page: Page, role: 'staff' | 'customer' | 'driver' | 'admin') {
    console.log(`🎯 SESSION INJECTION: Accessing ${role} portal with enhanced session management...`);
    
    // Step 1: Generate and inject real session
    const sessionSuccess = await this.injectServerSession(page, role);
    
    // Step 2: Set enhanced test mode headers
    await page.setExtraHTTPHeaders({
      'x-test-mode': 'true',
      'x-test-role': role,
      'x-session-injected': 'true',
      'x-session-type': sessionSuccess ? 'real' : 'mock'
    });
    
    // Step 3: Navigate to portal with enhanced timing
    const portalUrls = {
      staff: '/staff/',
      customer: '/portal/',
      driver: '/driver/',
      admin: '/staff/'
    };
    
    const targetUrl = portalUrls[role];
    console.log(`🌐 SESSION INJECTION: Navigating to ${targetUrl} for ${role}...`);
    
    await page.goto(`http://localhost:8849${targetUrl}`);
    
    // Enhanced wait strategy for session establishment
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Initial load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(3000); // Session validation time
    
    // Step 4: Validate session worked with enhanced checking
    const finalUrl = page.url();
    const isOnTargetPortal = finalUrl.includes(targetUrl.replace('/', ''));
    const isNotRedirectedToLogin = !finalUrl.includes('/login');
    const isNotUnauthorized = !finalUrl.includes('/unauthorized');
    
    const sessionWorked = isOnTargetPortal && isNotRedirectedToLogin && isNotUnauthorized;
    
    // Enhanced logging
    console.log(`📍 SESSION INJECTION RESULT for ${role}:`);
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Target Portal: ${isOnTargetPortal ? '✅' : '❌'}`);
    console.log(`   Not Login: ${isNotRedirectedToLogin ? '✅' : '❌'}`);
    console.log(`   Not Unauthorized: ${isNotUnauthorized ? '✅' : '❌'}`);
    console.log(`   Overall: ${sessionWorked ? '✅ SUCCESS' : '❌ NEEDS FALLBACK'}`);
    
    return {
      success: sessionWorked,
      finalUrl,
      targetUrl,
      role,
      method: 'enhanced-session-injection',
      sessionType: sessionSuccess ? 'real' : 'mock',
      checks: {
        onTargetPortal: isOnTargetPortal,
        notLogin: isNotRedirectedToLogin,
        notUnauthorized: isNotUnauthorized
      }
    };
  }
  
  /**
   * Test all portals with session injection in parallel
   */
  static async testAllPortalsWithSessions(pages: { page: Page, role: 'staff' | 'customer' | 'driver' | 'admin' }[]) {
    console.log('🚀 SESSION INJECTION: Testing all portals with injected sessions...');
    
    const sessionPromises = pages.map(async ({ page, role }) => {
      try {
        const result = await this.accessPortalWithSession(page, role);
        return { ...result, testPassed: result.success };
      } catch (error) {
        console.error(`❌ Session injection failed for ${role}:`, error);
        return { 
          success: false, 
          role, 
          error: error.message,
          testPassed: false,
          method: 'session-injection'
        };
      }
    });
    
    const results = await Promise.all(sessionPromises);
    const successful = results.filter(r => r.success);
    
    console.log(`📊 SESSION INJECTION: ${successful.length}/${pages.length} portals accessible`);
    return results;
  }
}

export default SessionInjectionSystem;