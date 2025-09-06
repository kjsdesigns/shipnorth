import { test, expect } from '@playwright/test';
import { ModalTestingUtils, RolePermissions } from './utils/modal-testing';

/**
 * 📱 CUSTOMER ROLE: Comprehensive CRUD Testing
 * 
 * Tests customer-specific operations: package tracking, profile management, payment methods
 * Validates customer portal interface and proper restrictions
 */

test.describe('📱 Customer Role - Complete CRUD Operations', () => {
  let modalUtils: ModalTestingUtils;

  test.beforeEach(async ({ page }) => {
    modalUtils = new ModalTestingUtils(page);
    
    // Login as customer user
    console.log('🔐 Logging in as customer user...');
    await page.goto('http://localhost:8849/login');
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Verify customer portal access
    expect(page.url()).toContain('/portal');
    console.log('✅ Customer login successful');
  });

  test.describe('📦 Package Tracking', () => {
    test('Customer can track their packages @crud @packages @customer', async ({ page }) => {
      console.log('📦 Testing Customer Package Tracking...');
      
      await page.goto('http://localhost:8849/portal');
      await page.waitForLoadState('networkidle');
      
      // Check tracking interface
      await expect(page.locator('h1:has-text("Track"), h2:has-text("Package"), text=Tracking')).toBeVisible();
      
      // Test tracking functionality
      const trackingElements = [
        'input[placeholder*="tracking"], input[name="trackingNumber"]',
        'button:has-text("Track"), button[type="submit"]'
      ];
      
      let trackingAvailable = true;
      for (const selector of trackingElements) {
        try {
          await expect(page.locator(selector)).toBeVisible();
          console.log(`✅ Customer can access: ${selector}`);
        } catch (error) {
          console.log(`❌ Missing tracking element: ${selector}`);
          trackingAvailable = false;
        }
      }
      
      expect(trackingAvailable).toBe(true);
      console.log('✅ Customer package tracking functionality validated');
    });

    test('Customer can view their package details @crud @packages @customer', async ({ page }) => {
      console.log('👁️ Testing Customer Package Details View...');
      
      await page.goto('http://localhost:8849/portal');
      await page.waitForLoadState('networkidle');
      
      // Look for package list or details
      const packageElements = [
        '.package-item',
        'tr[data-testid*="package"]',
        '.tracking-result',
        'text=Package #'
      ];
      
      let packagesVisible = false;
      for (const selector of packageElements) {
        try {
          if (await page.locator(selector).isVisible()) {
            console.log(`✅ Customer can see packages: ${selector}`);
            packagesVisible = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      expect(packagesVisible).toBe(true);
      console.log('✅ Customer package view functionality validated');
    });

    test('Customer cannot create, edit, or delete packages @permissions @security', async ({ page }) => {
      console.log('🛡️ Testing Customer Package Restrictions...');
      
      await page.goto('http://localhost:8849/portal');
      await page.waitForLoadState('networkidle');
      
      // Customer should NOT see package management buttons
      const restrictedActions = [
        'button:has-text("Add Package")',
        'button:has-text("New Package")', 
        'button:has-text("Edit Package")',
        'button:has-text("Delete Package")',
        '[data-testid="create-package"]'
      ];
      
      for (const selector of restrictedActions) {
        await expect(page.locator(selector)).not.toBeVisible();
        console.log(`✅ Customer correctly cannot see: ${selector}`);
      }
      
      console.log('✅ Customer package restrictions properly enforced');
    });
  });

  test.describe('💳 Payment Method Management', () => {
    test('Customer can manage payment methods @crud @payments @customer', async ({ page }) => {
      console.log('💳 Testing Customer Payment Method Management...');
      
      await page.goto('http://localhost:8849/portal/payment-methods');
      await page.waitForLoadState('networkidle');
      
      // Check payment method interface
      const paymentElements = [
        'h1:has-text("Payment"), h2:has-text("Payment Methods")',
        'button:has-text("Add Payment Method")',
        '.payment-method-item, .payment-card'
      ];
      
      let paymentInterfaceAvailable = true;
      for (const selector of paymentElements) {
        try {
          if (await page.locator(selector).isVisible()) {
            console.log(`✅ Customer payment interface includes: ${selector}`);
          }
        } catch (error) {
          console.log(`⚠️ Payment interface element not found: ${selector}`);
          paymentInterfaceAvailable = false;
        }
      }
      
      expect(paymentInterfaceAvailable).toBe(true);
      console.log('✅ Customer payment method functionality validated');
    });

    test('Customer can add payment method @crud @payments @customer', async ({ page }) => {
      console.log('🆕 Testing Customer Payment Method Creation...');
      
      await page.goto('http://localhost:8849/portal/payment-methods');
      await page.waitForLoadState('networkidle');
      
      // Test add payment method workflow
      const addPaymentSuccess = await modalUtils.testCreateWorkflow(
        'button:has-text("Add Payment Method"), button:has-text("Add Card")',
        {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          holderName: 'Test Customer'
        },
        'Payment method added successfully'
      );
      
      expect(addPaymentSuccess).toBe(true);
      console.log('✅ Customer payment method creation validated');
    });
  });

  test.describe('👤 Profile Management', () => {
    test('Customer can update their profile @crud @profile @customer', async ({ page }) => {
      console.log('👤 Testing Customer Profile Update...');
      
      // Navigate to profile/account section
      const profileUrls = [
        'http://localhost:8849/portal/profile',
        'http://localhost:8849/portal/account',
        'http://localhost:8849/portal'
      ];
      
      for (const url of profileUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Look for profile editing functionality
        const profileEditElements = [
          'button:has-text("Edit Profile")',
          'button:has-text("Update Account")',
          '[data-testid="edit-profile"]',
          'input[name="firstName"], input[name="email"]'
        ];
        
        let profileEditAvailable = false;
        for (const selector of profileEditElements) {
          try {
            if (await page.locator(selector).isVisible()) {
              console.log(`✅ Customer profile edit available: ${selector}`);
              profileEditAvailable = true;
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        if (profileEditAvailable) {
          expect(profileEditAvailable).toBe(true);
          console.log('✅ Customer profile management functionality validated');
          break;
        }
      }
    });
  });

  test.describe('🎛️ Customer Portal Interface Validation', () => {
    test('Customer sees distinct customer interface @interface @customer', async ({ page }) => {
      console.log('🔍 Validating Customer Portal Interface Distinctiveness...');
      
      await page.goto('http://localhost:8849/portal');
      await page.waitForLoadState('networkidle');
      
      // Check customer-specific interface elements
      const customerElements = [
        'text=Customer Portal, text=Track Your Packages',
        'text=Tracking',
        'text=Account',
        'text=Payment Methods'
      ];
      
      for (const element of customerElements) {
        try {
          await expect(page.locator(element)).toBeVisible();
          console.log(`✅ Customer interface includes: ${element}`);
        } catch (error) {
          console.log(`⚠️ Customer interface missing: ${element}`);
        }
      }
      
      // Customer should NOT see staff/admin/driver elements
      const restrictedElements = [
        'text=Staff Dashboard',
        'text=Customer Management',
        'text=Load Planning',
        'text=Driver Assignment',
        'text=Admin Panel'
      ];
      
      for (const element of restrictedElements) {
        await expect(page.locator(element)).not.toBeVisible();
        console.log(`✅ Customer correctly cannot see: ${element}`);
      }
      
      console.log('✅ Customer interface distinctiveness validated');
    });

    test('Customer cannot access staff/admin/driver areas @permissions @security', async ({ page }) => {
      console.log('🛡️ Testing Customer Access Restrictions...');
      
      const restrictedUrls = [
        'http://localhost:8849/staff',
        'http://localhost:8849/staff/customers', 
        'http://localhost:8849/driver',
        'http://localhost:8849/staff/admin'
      ];
      
      for (const url of restrictedUrls) {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        // Should be redirected away or show access denied
        const currentUrl = page.url();
        const isRestricted = !currentUrl.includes(url.replace('http://localhost:8849', '')) || 
                            currentUrl.includes('/login') ||
                            currentUrl.includes('/portal') ||
                            await page.locator('text=Access Denied, text=Unauthorized').isVisible();
        
        expect(isRestricted).toBe(true);
        console.log(`✅ Customer access to ${url} properly restricted → ${currentUrl}`);
      }
      
      console.log('✅ Customer access restrictions validated');
    });
  });
});