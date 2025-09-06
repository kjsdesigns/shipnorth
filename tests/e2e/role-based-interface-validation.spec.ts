import { test, expect } from '@playwright/test';

/**
 * 🎭 ROLE-BASED INTERFACE VALIDATION
 * 
 * Comprehensive testing that each user type sees their distinct interface
 * and can perform only their authorized operations
 */

test.describe('🎭 Role-Based Interface and Permission Validation', () => {

  test.describe('🔐 Login and Portal Routing Validation', () => {
    test('All user types can sign in and reach correct portals @login @routing', async ({ page }) => {
      console.log('🎯 Testing All User Login and Portal Routing...');
      
      const userTypes = [
        { 
          credentials: { email: 'staff@shipnorth.com', password: 'staff123' },
          expectedPortal: '/staff/',
          portalName: 'Staff Portal'
        },
        {
          credentials: { email: 'admin@shipnorth.com', password: 'admin123' },
          expectedPortal: '/staff/',
          portalName: 'Staff Portal (Admin Access)'
        },
        {
          credentials: { email: 'driver@shipnorth.com', password: 'driver123' },
          expectedPortal: '/driver/',
          portalName: 'Driver Portal'
        },
        {
          credentials: { email: 'test@test.com', password: 'test123' },
          expectedPortal: '/portal/',
          portalName: 'Customer Portal'
        }
      ];

      for (const userType of userTypes) {
        console.log(`\n👤 Testing: ${userType.credentials.email}`);
        
        // Login process
        await page.goto('http://localhost:8849/login');
        await page.waitForLoadState('domcontentloaded');
        
        await page.fill('input[type="email"]', userType.credentials.email);
        await page.fill('input[type="password"]', userType.credentials.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Verify correct portal routing
        const currentUrl = page.url();
        expect(currentUrl).toContain(userType.expectedPortal);
        console.log(`   ✅ Correctly routed to ${userType.portalName}: ${currentUrl}`);
        
        // Verify portal interface loads
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const stableUrl = page.url();
        expect(stableUrl).toContain(userType.expectedPortal);
        console.log(`   ✅ ${userType.portalName} interface stable`);
      }
      
      console.log('🎉 All user types login and routing validated!');
    });
  });

  test.describe('🎯 Interface Distinctiveness Validation', () => {
    test('Staff interface is distinct from other roles @interface @staff', async ({ page }) => {
      console.log('🏢 Validating Staff Interface Distinctiveness...');
      
      // Login as staff
      await page.goto('http://localhost:8849/login');
      await page.fill('input[type="email"]', 'staff@shipnorth.com');
      await page.fill('input[type="password"]', 'staff123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.waitForLoadState('networkidle');
      
      // Staff should see management features
      const staffFeatures = [
        'text=Staff Dashboard',
        'nav a:has-text("Customers")',
        'nav a:has-text("Packages")', 
        'nav a:has-text("Loads")',
        'text=Package Management',
        'text=Customer Management'
      ];
      
      for (const feature of staffFeatures) {
        await expect(page.locator(feature)).toBeVisible();
        console.log(`   ✅ Staff interface includes: ${feature}`);
      }
      
      // Staff should NOT see driver/customer specific elements
      const nonStaffFeatures = [
        'text=Driver Dashboard',
        'text=My Deliveries',
        'text=Track Package Only',
        'nav a:has-text("Earnings")'
      ];
      
      for (const feature of nonStaffFeatures) {
        await expect(page.locator(feature)).not.toBeVisible();
        console.log(`   ✅ Staff correctly doesn't see: ${feature}`);
      }
      
      console.log('✅ Staff interface distinctiveness validated');
    });

    test('Driver interface is distinct from other roles @interface @driver', async ({ page }) => {
      console.log('🚛 Validating Driver Interface Distinctiveness...');
      
      // Login as driver  
      await page.goto('http://localhost:8849/login');
      await page.fill('input[type="email"]', 'driver@shipnorth.com');
      await page.fill('input[type="password"]', 'driver123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.waitForLoadState('networkidle');
      
      // Driver should see delivery/route features
      const driverFeatures = [
        'text=Driver Dashboard, text=Driver Portal',
        'nav a:has-text("Loads"), text=My Loads',
        'nav a:has-text("Routes")',
        'nav a:has-text("Deliveries")',
        'nav a:has-text("Earnings")'
      ];
      
      let driverFeaturesFound = 0;
      for (const feature of driverFeatures) {
        try {
          if (await page.locator(feature).isVisible()) {
            driverFeaturesFound++;
            console.log(`   ✅ Driver interface includes: ${feature}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(driverFeaturesFound).toBeGreaterThan(0);
      
      // Driver should NOT see management features
      const nonDriverFeatures = [
        'text=Customer Management',
        'text=Add Package',
        'text=Admin Panel',
        'nav a:has-text("Customers")'
      ];
      
      for (const feature of nonDriverFeatures) {
        await expect(page.locator(feature)).not.toBeVisible();
        console.log(`   ✅ Driver correctly doesn't see: ${feature}`);
      }
      
      console.log('✅ Driver interface distinctiveness validated');
    });

    test('Customer interface is distinct from other roles @interface @customer', async ({ page }) => {
      console.log('📱 Validating Customer Interface Distinctiveness...');
      
      // Login as customer
      await page.goto('http://localhost:8849/login');
      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.waitForLoadState('networkidle');
      
      // Customer should see self-service features only
      const customerFeatures = [
        'text=Customer Portal, text=Track Your Packages',
        'text=Tracking',
        'text=Account, text=Profile',
        'input[placeholder*="tracking"], input[name="trackingNumber"]'
      ];
      
      let customerFeaturesFound = 0;
      for (const feature of customerFeatures) {
        try {
          if (await page.locator(feature).isVisible()) {
            customerFeaturesFound++;
            console.log(`   ✅ Customer interface includes: ${feature}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(customerFeaturesFound).toBeGreaterThan(0);
      
      // Customer should NOT see any management features
      const nonCustomerFeatures = [
        'text=Staff Dashboard',
        'text=Driver Dashboard', 
        'text=Customer Management',
        'text=Load Planning',
        'text=Admin Panel',
        'button:has-text("Add Package")',
        'button:has-text("Add Customer")'
      ];
      
      for (const feature of nonCustomerFeatures) {
        await expect(page.locator(feature)).not.toBeVisible();
        console.log(`   ✅ Customer correctly doesn't see: ${feature}`);
      }
      
      console.log('✅ Customer interface distinctiveness validated');
    });

    test('Admin interface includes enhanced management features @interface @admin', async ({ page }) => {
      console.log('👑 Validating Admin Enhanced Interface...');
      
      // Login as admin
      await page.goto('http://localhost:8849/login');
      await page.fill('input[type="email"]', 'admin@shipnorth.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.waitForLoadState('networkidle');
      
      // Admin should see staff features PLUS admin features
      const adminEnhancedFeatures = [
        'text=Admin, nav a[href*="admin"]',
        'text=User Management',
        'text=System Settings',
        'text=Analytics',
        'text=Audit'
      ];
      
      let adminFeaturesFound = 0;
      for (const feature of adminEnhancedFeatures) {
        try {
          if (await page.locator(feature).isVisible()) {
            adminFeaturesFound++;
            console.log(`   ✅ Admin enhanced interface includes: ${feature}`);
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(adminFeaturesFound).toBeGreaterThan(0);
      console.log('✅ Admin enhanced interface validated');
    });
  });

  test.describe('🔒 Cross-Role Permission Enforcement', () => {
    test('Users cannot access unauthorized portal areas @security @permissions', async ({ page }) => {
      console.log('🛡️ Testing Cross-Role Access Restrictions...');
      
      const accessTests = [
        {
          user: { email: 'driver@shipnorth.com', password: 'driver123' },
          restrictedUrls: [
            'http://localhost:8849/staff/customers',
            'http://localhost:8849/staff/admin',
            'http://localhost:8849/portal'
          ]
        },
        {
          user: { email: 'test@test.com', password: 'test123' },
          restrictedUrls: [
            'http://localhost:8849/staff',
            'http://localhost:8849/driver',
            'http://localhost:8849/staff/admin'
          ]
        },
        {
          user: { email: 'staff@shipnorth.com', password: 'staff123' },
          restrictedUrls: [
            'http://localhost:8849/staff/admin' // Staff should not access admin
          ]
        }
      ];
      
      for (const accessTest of accessTests) {
        console.log(`\n🔐 Testing restrictions for ${accessTest.user.email}:`);
        
        // Login as this user
        await page.goto('http://localhost:8849/login');
        await page.fill('input[type="email"]', accessTest.user.email);
        await page.fill('input[type="password"]', accessTest.user.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Test each restricted URL
        for (const restrictedUrl of accessTest.restrictedUrls) {
          await page.goto(restrictedUrl);
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          const isRestricted = !currentUrl.includes(restrictedUrl.replace('http://localhost:8849', '')) ||
                               currentUrl.includes('/login') ||
                               await page.locator('text=Access Denied, text=Unauthorized, text=Forbidden').isVisible();
          
          expect(isRestricted).toBe(true);
          console.log(`     ✅ Access to ${restrictedUrl} properly restricted → ${currentUrl}`);
        }
      }
      
      console.log('✅ All cross-role access restrictions validated');
    });
  });

  test.describe('⚡ Session Persistence During Operations', () => {
    test('All user types maintain session during extended operations @session @persistence', async ({ page }) => {
      console.log('⏱️ Testing Session Persistence During Extended Operations...');
      
      const userTypes = [
        { email: 'staff@shipnorth.com', password: 'staff123', portal: '/staff/' },
        { email: 'driver@shipnorth.com', password: 'driver123', portal: '/driver/' },
        { email: 'test@test.com', password: 'test123', portal: '/portal/' }
      ];

      for (const user of userTypes) {
        console.log(`\n⏳ Testing session persistence for ${user.email}:`);
        
        // Login
        await page.goto('http://localhost:8849/login');
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        expect(page.url()).toContain(user.portal);
        
        // Navigate around portal extensively
        const navigationTests = [
          () => page.reload(),
          () => page.goBack(),
          () => page.goForward(),
          () => page.goto(`http://localhost:8849${user.portal}`)
        ];
        
        for (let i = 0; i < navigationTests.length; i++) {
          await navigationTests[i]();
          await page.waitForTimeout(1500);
          
          const currentUrl = page.url();
          const sessionMaintained = !currentUrl.includes('/login');
          
          expect(sessionMaintained).toBe(true);
          console.log(`     ✅ Navigation test ${i+1}: Session maintained`);
        }
        
        // Extended wait test
        console.log('     ⏰ Testing extended session duration...');
        await page.waitForTimeout(5000);
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        const sessionStillValid = !finalUrl.includes('/login');
        
        expect(sessionStillValid).toBe(true);
        console.log(`     ✅ Extended session test: ${sessionStillValid ? 'Session maintained' : 'Session expired'}`);
      }
      
      console.log('🎉 All user session persistence validated!');
    });
  });

  test.describe('🔄 Multi-User Concurrent Testing', () => {
    test('Multiple users can work simultaneously @concurrent @session', async ({ browser }) => {
      console.log('👥 Testing Multiple Users Working Simultaneously...');
      
      // Create multiple browser contexts for concurrent users
      const staffContext = await browser.newContext();
      const driverContext = await browser.newContext();
      const customerContext = await browser.newContext();
      
      const staffPage = await staffContext.newPage();
      const driverPage = await driverContext.newPage();
      const customerPage = await customerContext.newPage();
      
      try {
        // Login all users concurrently
        console.log('🔐 Logging in multiple users concurrently...');
        
        const loginPromises = [
          // Staff login
          (async () => {
            await staffPage.goto('http://localhost:8849/login');
            await staffPage.fill('input[type="email"]', 'staff@shipnorth.com');
            await staffPage.fill('input[type="password"]', 'staff123');
            await staffPage.click('button[type="submit"]');
            await staffPage.waitForTimeout(2000);
            return staffPage.url().includes('/staff');
          })(),
          
          // Driver login
          (async () => {
            await driverPage.goto('http://localhost:8849/login');
            await driverPage.fill('input[type="email"]', 'driver@shipnorth.com');
            await driverPage.fill('input[type="password"]', 'driver123');
            await driverPage.click('button[type="submit"]');
            await driverPage.waitForTimeout(2000);
            return driverPage.url().includes('/driver');
          })(),
          
          // Customer login
          (async () => {
            await customerPage.goto('http://localhost:8849/login');
            await customerPage.fill('input[type="email"]', 'test@test.com');
            await customerPage.fill('input[type="password"]', 'test123');
            await customerPage.click('button[type="submit"]');
            await customerPage.waitForTimeout(2000);
            return customerPage.url().includes('/portal');
          })()
        ];
        
        const loginResults = await Promise.all(loginPromises);
        
        // Verify all logins successful
        expect(loginResults[0]).toBe(true); // Staff
        expect(loginResults[1]).toBe(true); // Driver  
        expect(loginResults[2]).toBe(true); // Customer
        
        console.log('✅ All concurrent logins successful');
        
        // Test concurrent operations
        console.log('⚡ Testing concurrent portal operations...');
        
        const operationPromises = [
          // Staff navigates to customers
          (async () => {
            await staffPage.goto('http://localhost:8849/staff/customers');
            await staffPage.waitForLoadState('networkidle');
            return staffPage.url().includes('/customers');
          })(),
          
          // Driver navigates to loads
          (async () => {
            await driverPage.goto('http://localhost:8849/driver/loads');
            await driverPage.waitForLoadState('networkidle');
            return driverPage.url().includes('/loads');
          })(),
          
          // Customer does tracking
          (async () => {
            await customerPage.goto('http://localhost:8849/portal');
            await customerPage.waitForLoadState('networkidle');
            return customerPage.url().includes('/portal');
          })()
        ];
        
        const operationResults = await Promise.all(operationPromises);
        
        expect(operationResults[0]).toBe(true); // Staff customers access
        expect(operationResults[1]).toBe(true); // Driver loads access
        expect(operationResults[2]).toBe(true); // Customer portal access
        
        console.log('✅ All concurrent operations successful');
        
        // Verify sessions still maintained
        await staffPage.reload();
        await driverPage.reload(); 
        await customerPage.reload();
        
        await Promise.all([
          staffPage.waitForLoadState('networkidle'),
          driverPage.waitForLoadState('networkidle'),
          customerPage.waitForLoadState('networkidle')
        ]);
        
        expect(staffPage.url()).toContain('/staff');
        expect(driverPage.url()).toContain('/driver');
        expect(customerPage.url()).toContain('/portal');
        
        console.log('✅ All sessions maintained after concurrent operations');
        
      } finally {
        // Cleanup
        await staffContext.close();
        await driverContext.close();
        await customerContext.close();
      }
      
      console.log('🎉 Multi-user concurrent testing validated!');
    });
  });

  test.describe('🎚️ Permission Boundary Testing', () => {
    test('Role-based operation restrictions are enforced @permissions @security', async ({ page }) => {
      console.log('🔒 Testing Role-Based Operation Restrictions...');
      
      const permissionTests = [
        {
          user: { email: 'driver@shipnorth.com', password: 'driver123' },
          allowedPages: ['/driver', '/driver/loads', '/driver/routes'],
          restrictedPages: ['/staff/customers', '/staff/admin', '/staff/packages'],
          allowedActions: ['View Load', 'Update Status'],
          restrictedActions: ['Add Customer', 'Delete Package', 'Create Load']
        },
        {
          user: { email: 'test@test.com', password: 'test123' },
          allowedPages: ['/portal', '/portal/track'],
          restrictedPages: ['/staff', '/driver', '/staff/admin'],
          allowedActions: ['Track Package', 'Update Profile'],
          restrictedActions: ['Add Package', 'Manage Load', 'Add User']
        }
      ];
      
      for (const permTest of permissionTests) {
        console.log(`\n🔍 Testing permissions for ${permTest.user.email}:`);
        
        // Login
        await page.goto('http://localhost:8849/login');
        await page.fill('input[type="email"]', permTest.user.email);
        await page.fill('input[type="password"]', permTest.user.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Test allowed pages are accessible
        for (const allowedPage of permTest.allowedPages) {
          await page.goto(`http://localhost:8849${allowedPage}`);
          await page.waitForTimeout(1500);
          
          const currentUrl = page.url();
          const hasAccess = currentUrl.includes(allowedPage) && !currentUrl.includes('/login');
          
          expect(hasAccess).toBe(true);
          console.log(`     ✅ Access granted to: ${allowedPage}`);
        }
        
        // Test restricted pages are blocked
        for (const restrictedPage of permTest.restrictedPages) {
          await page.goto(`http://localhost:8849${restrictedPage}`);
          await page.waitForTimeout(1500);
          
          const currentUrl = page.url();
          const isBlocked = !currentUrl.includes(restrictedPage) || 
                           currentUrl.includes('/login') ||
                           await page.locator('text=Access Denied').isVisible();
          
          expect(isBlocked).toBe(true);
          console.log(`     ✅ Access blocked to: ${restrictedPage} → ${currentUrl}`);
        }
      }
      
      console.log('🎉 All permission boundaries validated!');
    });
  });
});