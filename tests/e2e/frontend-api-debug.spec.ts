import { test, expect } from '@playwright/test';

/**
 * Progressive Frontend-API Connectivity Debug Suite
 * Tests browser-specific connectivity issues systematically
 */

test.describe.serial('🔬 Frontend-API Connectivity Debug', () => {
  test.setTimeout(120000);

  const API_PORT = process.env.API_PORT || 8850;
  const WEB_PORT = process.env.WEB_PORT || 8849;
  const API_URL = `http://localhost:${API_PORT}`;
  const WEB_URL = `http://localhost:${WEB_PORT}`;

  test('Hypothesis 1: Browser Network Connectivity', async ({ page }) => {
    console.log('🧪 Testing browser network connectivity to API...');

    // Test direct API call from browser context
    try {
      const response = await page.request.get(`${API_URL}/health`);
      const data = await response.json();
      
      if (response.ok()) {
        console.log('✅ Browser can reach API directly');
        console.log(`📊 Response: ${JSON.stringify(data)}`);
      } else {
        console.log(`❌ Browser API call failed: ${response.status()}`);
      }
    } catch (error) {
      console.log(`❌ Browser network error: ${error.message}`);
      throw new Error(`Browser cannot reach API: ${error.message}`);
    }
  });

  test('Hypothesis 2: Frontend Build Environment Variables', async ({ page }) => {
    console.log('🧪 Testing frontend build environment variables...');

    await page.goto(WEB_URL);
    
    // Inject script to check what API URL the frontend is using
    const apiUrlCheck = await page.evaluate(() => {
      // Check if window has any API configuration
      return {
        // @ts-ignore
        nextConfig: window.__NEXT_DATA__?.buildId || 'unknown',
        // @ts-ignore
        apiUrl: window.location.origin,
        env: {
          // @ts-ignore
          nodeEnv: process?.env?.NODE_ENV || 'unknown'
        }
      };
    });

    console.log('📊 Frontend environment check:', JSON.stringify(apiUrlCheck, null, 2));

    // Check if page source contains correct API URL
    const pageContent = await page.content();
    if (pageContent.includes(`localhost:${API_PORT}`)) {
      console.log('✅ Frontend HTML contains correct API URL');
    } else {
      console.log('❌ Frontend HTML missing correct API URL');
      console.log('🔍 Checking for any API URL references...');
      const apiRefs = pageContent.match(/localhost:[0-9]{4}/g) || [];
      console.log('📋 Found API references:', apiRefs);
    }
  });

  test('Hypothesis 3: Browser Console and Network Errors', async ({ page }) => {
    console.log('🧪 Testing browser console and network errors...');

    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const requests: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      console.log(`🖥️ Console [${msg.type()}]: ${text}`);
    });

    // Capture all network requests and failures
    page.on('request', req => {
      requests.push(`${req.method()} ${req.url()}`);
      console.log(`📤 Request: ${req.method()} ${req.url()}`);
    });

    page.on('response', resp => {
      console.log(`📥 Response: ${resp.status()} ${resp.url()}`);
      if (!resp.ok()) {
        networkErrors.push(`${resp.status()} ${resp.url()}`);
      }
    });

    page.on('requestfailed', req => {
      const failure = `${req.method()} ${req.url()} - ${req.failure()?.errorText}`;
      networkErrors.push(failure);
      console.log(`❌ Request Failed: ${failure}`);
    });

    await page.goto(`${WEB_URL}/login`);
    await page.waitForTimeout(5000);

    console.log('\n📊 Diagnostic Summary:');
    console.log(`🔴 Console Errors: ${consoleErrors.length}`);
    console.log(`🌐 Network Errors: ${networkErrors.length}`);
    console.log(`📡 Total Requests: ${requests.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n🔴 Console Errors Found:');
      consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors Found:');
      networkErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
  });

  test('Hypothesis 4: API Login Form Submission Test', async ({ page }) => {
    console.log('🧪 Testing actual login form submission...');

    const requests: any[] = [];
    const responses: any[] = [];

    page.on('request', req => {
      if (req.url().includes('/auth/login')) {
        requests.push({
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: req.postData()
        });
        console.log(`📤 Login Request: ${req.method()} ${req.url()}`);
        console.log(`📋 Headers:`, req.headers());
        console.log(`📄 Post Data:`, req.postData());
      }
    });

    page.on('response', resp => {
      if (resp.url().includes('/auth/login')) {
        responses.push({
          url: resp.url(),
          status: resp.status(),
          headers: resp.headers()
        });
        console.log(`📥 Login Response: ${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto(`${WEB_URL}/login`);
    await page.waitForTimeout(2000);

    // Fill and submit login form
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    
    console.log('🔐 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(5000);

    console.log('\n📊 Login Submission Analysis:');
    console.log(`📤 Requests Made: ${requests.length}`);
    console.log(`📥 Responses Received: ${responses.length}`);

    if (requests.length === 0) {
      console.log('❌ No login requests detected - form submission failed');
      
      // Check if form exists and is properly configured
      const formExists = await page.locator('form').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      
      console.log(`📋 Form elements found: ${formExists} forms, ${submitButton} submit buttons`);
      
      if (formExists === 0) {
        throw new Error('Login form not found on page');
      }
    } else {
      console.log('✅ Login request detected');
      requests.forEach((req, i) => {
        console.log(`  Request ${i + 1}:`, JSON.stringify(req, null, 2));
      });
      responses.forEach((resp, i) => {
        console.log(`  Response ${i + 1}:`, JSON.stringify(resp, null, 2));
      });
    }
  });

  test('Hypothesis 5: CORS Preflight Deep Dive', async ({ page }) => {
    console.log('🧪 Testing CORS preflight and actual requests...');

    // Test CORS from browser context with detailed headers
    const corsTest = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        return {
          ok: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url,
          data: await response.text()
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    }, API_URL);

    console.log('📊 Browser fetch test result:', JSON.stringify(corsTest, null, 2));

    if (corsTest.error) {
      console.log(`❌ Browser fetch failed: ${corsTest.error}`);
    } else {
      console.log(`✅ Browser fetch succeeded: ${corsTest.status}`);
    }
  });

  test('Hypothesis 6: Container Internal Communication', async ({ page }) => {
    console.log('🧪 Testing container internal communication patterns...');

    // Check what URLs are actually being used by the frontend
    await page.goto(WEB_URL);
    
    // Monitor all fetch/XHR requests  
    const apiRequests: string[] = [];
    
    await page.route('**/*', async (route, request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/auth/') || url.includes(':8850')) {
        apiRequests.push(`${request.method()} ${url}`);
        console.log(`🔍 Intercepted API request: ${request.method()} ${url}`);
      }
      await route.continue();
    });

    // Try to trigger an API call
    await page.goto(`${WEB_URL}/login`);
    await page.waitForTimeout(3000);

    console.log(`📊 API requests intercepted: ${apiRequests.length}`);
    apiRequests.forEach((req, i) => console.log(`  ${i + 1}. ${req}`));

    if (apiRequests.length === 0) {
      console.log('❌ No API requests detected from frontend');
      console.log('🔍 Frontend may not be making API calls or using wrong URLs');
    }
  });
});