import { Page } from '@playwright/test';

export class QuickLoginHelpers {
  
  /**
   * Use the quick login buttons that are designed for demo/testing
   */
  static async quickLoginAsStaff(page: Page) {
    console.log('🚀 Using quick login button for staff...');
    
    // Go to login page
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    // Look for the staff quick login button
    const staffButton = page.locator('button:has-text("Staff")').first();
    
    if (await staffButton.isVisible()) {
      console.log('✅ Found staff quick login button');
      await staffButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log(`📍 After quick login: ${page.url()}`);
      return true;
    }
    
    console.log('⚠️ Quick login button not found, falling back to form');
    return false;
  }
  
  static async quickLoginAsCustomer(page: Page) {
    console.log('🚀 Using quick login button for customer...');
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    const customerButton = page.locator('button:has-text("Customer")');
    
    if (await customerButton.isVisible()) {
      console.log('✅ Found customer quick login button');
      await customerButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log(`📍 After quick login: ${page.url()}`);
      return true;
    }
    
    return false;
  }
  
  static async quickLoginAsDriver(page: Page) {
    console.log('🚀 Using quick login button for driver...');
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    const driverButton = page.locator('button:has-text("Driver")');
    
    if (await driverButton.isVisible()) {
      console.log('✅ Found driver quick login button');
      await driverButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log(`📍 After quick login: ${page.url()}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Fallback to manual form login if quick buttons don't work
   */
  static async manualLogin(page: Page, email: string, password: string) {
    console.log(`🔐 Manual form login for ${email}...`);
    
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login/`);
    await page.waitForLoadState('networkidle');
    
    // Fill form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`📍 After manual login: ${page.url()}`);
  }
  
  /**
   * Comprehensive login that tries quick button first, then manual
   */
  static async loginAs(page: Page, role: 'staff' | 'customer' | 'driver') {
    console.log(`🎯 Comprehensive login as ${role}...`);
    
    let success = false;
    
    // Try quick login first
    switch (role) {
      case 'staff':
        success = await this.quickLoginAsStaff(page);
        if (!success) {
          await this.manualLogin(page, 'staff@shipnorth.com', 'staff123');
        }
        break;
      case 'customer':
        success = await this.quickLoginAsCustomer(page);
        if (!success) {
          await this.manualLogin(page, 'test@test.com', 'test123');
        }
        break;
      case 'driver':
        success = await this.quickLoginAsDriver(page);
        if (!success) {
          await this.manualLogin(page, 'driver@shipnorth.com', 'driver123');
        }
        break;
    }
    
    // Verify we're not on an error page
    const currentUrl = page.url();
    const hasError = currentUrl.includes('chrome-error') || currentUrl.includes('error');
    
    if (hasError) {
      throw new Error(`Login failed - redirected to error page: ${currentUrl}`);
    }
    
    console.log(`✅ Login as ${role} completed: ${currentUrl}`);
    return currentUrl;
  }
}

export default QuickLoginHelpers;