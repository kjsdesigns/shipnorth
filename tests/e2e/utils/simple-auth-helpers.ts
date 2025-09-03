import { Page } from '@playwright/test';

export class SimpleAuthHelpers {
  
  static async performLogin(page: Page, email = 'staff@shipnorth.com', password = 'staff123') {
    console.log(`🔐 Logging in as ${email}...`);
    
    // Go to login page
    await page.goto(`http://localhost:${process.env.WEB_PORT || 8849}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill and submit
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Wait for process
    await page.waitForTimeout(2000);
    
    console.log(`📍 Post-login URL: ${page.url()}`);
    return page.url();
  }
  
  static async ensureOnPage(page: Page, targetPath: string) {
    const fullUrl = `http://localhost:${process.env.WEB_PORT || 8849}${targetPath}`;
    const currentUrl = page.url();
    
    if (!currentUrl.includes(targetPath)) {
      console.log(`🔄 Redirecting to ${targetPath}...`);
      await page.goto(fullUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    console.log(`✅ On page: ${page.url()}`);
  }
  
  static async waitForPageElements(page: Page, selectors: string[], timeout = 5000) {
    console.log('⏳ Waiting for page elements to load...');
    
    const results = [];
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout });
        const count = await page.locator(selector).count();
        results.push({ selector, count, found: true });
        console.log(`✅ Found ${count} elements: ${selector}`);
      } catch (error) {
        results.push({ selector, count: 0, found: false });
        console.log(`⚠️ Not found: ${selector}`);
      }
    }
    
    return results;
  }
}

export default SimpleAuthHelpers;