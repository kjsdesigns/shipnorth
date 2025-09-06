import { Page } from '@playwright/test';

/**
 * Bypass authentication by directly setting browser state
 * This avoids the complex AuthContext and login form issues
 */
export class BypassAuthHelpers {
  
  static async bypassLoginAsStaff(page: Page) {
    console.log('🔄 Bypassing authentication for staff...');
    
    // Go to login page first to set up the domain
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    // Directly set authentication state in browser AND cookies
    await page.context().addCookies([
      {
        name: 'user',
        value: JSON.stringify({
          id: '39d576b9-ae19-4832-8fdd-915ed0e704bf',
          email: 'staff@shipnorth.com',
          roles: ['staff'],
          role: 'staff',
          firstName: 'Staff',
          lastName: 'User',
          availablePortals: ['staff'],
          defaultPortal: 'staff',
          hasAdminAccess: false
        }),
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'accessToken',
        value: 'test-token-bypass',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'refreshToken',
        value: 'test-token-bypass',
        domain: 'localhost', 
        path: '/'
      }
    ]);
    
    await page.evaluate(() => {
      // Set localStorage data that AuthContext expects
      const userData = {
        id: '39d576b9-ae19-4832-8fdd-915ed0e704bf',
        email: 'staff@shipnorth.com',
        roles: ['staff'],
        role: 'staff',
        firstName: 'Staff',
        lastName: 'User',
        availablePortals: ['staff'],
        defaultPortal: 'staff',
        hasAdminAccess: false
      };
      
      const token = 'test-token-bypass';
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      
      console.log('✅ Authentication state set in localStorage and cookies');
    });
    
    // Navigate to staff portal (with trailing slash to avoid redirect)
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/staff/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log(`📍 Bypass login result: ${page.url()}`);
    return page.url();
  }
  
  static async bypassLoginAsCustomer(page: Page) {
    console.log('🔄 Bypassing authentication for customer...');
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(() => {
      const userData = {
        id: 'customer-test-id',
        email: 'test@test.com',
        roles: ['customer'],
        role: 'customer',
        firstName: 'Test',
        lastName: 'Customer',
        availablePortals: ['customer'],
        defaultPortal: 'customer',
        hasAdminAccess: false
      };
      
      const token = 'customer-token-bypass';
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      if (typeof window.Cookies !== 'undefined') {
        window.Cookies.set('user', JSON.stringify(userData));
        window.Cookies.set('accessToken', token);
      }
    });
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/portal/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log(`📍 Customer bypass result: ${page.url()}`);
    return page.url();
  }
  
  static async bypassLoginAsDriver(page: Page) {
    console.log('🔄 Bypassing authentication for driver...');
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(() => {
      const userData = {
        id: 'driver-test-id',
        email: 'driver@shipnorth.com',
        roles: ['driver'],
        role: 'driver',
        firstName: 'Test',
        lastName: 'Driver',
        availablePortals: ['driver'],
        defaultPortal: 'driver',
        hasAdminAccess: false
      };
      
      const token = 'driver-token-bypass';
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      if (typeof window.Cookies !== 'undefined') {
        window.Cookies.set('user', JSON.stringify(userData));
        window.Cookies.set('accessToken', token);
      }
    });
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/driver/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log(`📍 Driver bypass result: ${page.url()}`);
    return page.url();
  }
}

export default BypassAuthHelpers;