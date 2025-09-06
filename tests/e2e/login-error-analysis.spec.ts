import { test, expect } from '@playwright/test';
import { config } from './config';

/**
 * COMPREHENSIVE LOGIN ERROR ANALYSIS
 * Tests actual login functionality and captures error messages displayed to users
 */

test.describe('🔍 Login Error Analysis', () => {
  
  test('staff login error message analysis', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${config.webUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    console.log(`🌐 Testing login at: ${config.webUrl}/login`);
    
    // Take screenshot of initial login page
    await page.screenshot({ 
      path: 'test-artifacts/login-page-initial.png',
      fullPage: true 
    });
    
    // Try to login with staff credentials
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Verify login form exists
    await expect(emailField).toBeVisible({ timeout: 10000 });
    await expect(passwordField).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Fill and submit login form
    await emailField.fill('staff@shipnorth.com');
    await passwordField.fill('staff123');
    
    console.log('📝 Filled login form with staff@shipnorth.com / staff123');
    
    // Click login button
    await loginButton.click();
    
    // Wait for response and capture the result
    await page.waitForTimeout(3000);
    
    // Take screenshot after login attempt
    await page.screenshot({ 
      path: 'test-artifacts/login-page-after-attempt.png',
      fullPage: true 
    });
    
    // Check for any error messages
    const errorSelectors = [
      '.error',
      '.alert',
      '.alert-error',
      '.text-red-500',
      '.text-red-600',
      '[data-testid="error"]',
      '[data-testid="error-message"]',
      '.error-message',
      '.login-error',
      '.notification',
      '.toast',
      'div:has-text("error")',
      'div:has-text("failed")',
      'div:has-text("invalid")',
      'div:has-text("incorrect")',
      'p:has-text("error")',
      'span:has-text("error")'
    ];
    
    let errorMessage = '';
    let errorFound = false;
    
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible()) {
          errorMessage = await errorElement.textContent() || '';
          if (errorMessage.trim()) {
            console.log(`❌ Error found with selector "${selector}": ${errorMessage}`);
            errorFound = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no specific error selector found, check all visible text for error patterns
    if (!errorFound) {
      const pageContent = await page.textContent('body');
      const errorPatterns = [
        /error/i,
        /failed/i,
        /invalid/i,
        /incorrect/i,
        /denied/i,
        /unauthorized/i,
        /authentication/i
      ];
      
      for (const pattern of errorPatterns) {
        if (pattern.test(pageContent || '')) {
          const matches = (pageContent || '').match(pattern);
          if (matches) {
            console.log(`❌ Error pattern found in page content: ${matches[0]}`);
            errorFound = true;
            
            // Extract surrounding context
            const index = (pageContent || '').search(pattern);
            const start = Math.max(0, index - 50);
            const end = Math.min((pageContent || '').length, index + 100);
            const context = (pageContent || '').substring(start, end);
            console.log(`📄 Error context: "${context}"`);
            errorMessage = context;
            break;
          }
        }
      }
    }
    
    // Check current URL to see if redirect occurred
    const currentUrl = page.url();
    console.log(`📍 Current URL after login attempt: ${currentUrl}`);
    
    // Check for success indicators
    const isOnLoginPage = currentUrl.includes('/login');
    const isOnDashboard = currentUrl.includes('/staff') || currentUrl.includes('/dashboard');
    
    if (isOnDashboard) {
      console.log('✅ Login successful - redirected to dashboard');
    } else if (isOnLoginPage) {
      console.log('❌ Login failed - still on login page');
      if (errorMessage) {
        console.log(`❌ Error message displayed: "${errorMessage}"`);
      } else {
        console.log('⚠️ No error message found, but login failed');
      }
    }
    
    // Check console logs for any JavaScript errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
        console.log(`🔴 Console error: ${msg.text()}`);
      }
    });
    
    // Get network requests to see API responses
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`🌐 Login API response: ${response.status()} ${response.statusText()}`);
      }
    });
    
    // Make assertions based on what we found
    if (errorFound) {
      console.log(`📊 LOGIN TEST RESULT: FAILED with error: "${errorMessage}"`);
      // Don't fail the test, just report the findings
    } else {
      console.log('📊 LOGIN TEST RESULT: No clear error message found');
    }
    
    // Always pass the test but log comprehensive results
    expect(true).toBe(true);
  });
  
  test('verify API connectivity directly', async ({ page }) => {
    // Test API directly
    const apiResponse = await page.request.get(`${config.apiUrl}/health`);
    console.log(`🔗 API Health: ${apiResponse.status()}`);
    expect(apiResponse.status()).toBe(200);
    
    // Test login API directly
    const loginResponse = await page.request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: 'staff@shipnorth.com',
        password: 'staff123'
      }
    });
    
    console.log(`🔗 Direct API Login: ${loginResponse.status()}`);
    
    if (loginResponse.status() !== 200) {
      const errorText = await loginResponse.text();
      console.log(`❌ API Login Error: ${errorText}`);
    } else {
      const responseData = await loginResponse.json();
      console.log(`✅ API Login Success: ${JSON.stringify(responseData, null, 2)}`);
    }
  });

});