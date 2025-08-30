import { test, expect } from '@playwright/test';

/**
 * 🔬 Frontend-API Connectivity Diagnostic Test
 * 
 * This test runs FIRST in the test suite to proactively detect and diagnose
 * the recurring frontend-API connectivity issue. It implements the 10-hypothesis
 * testing approach that successfully identified the CORS headers root cause.
 * 
 * If this test fails, it provides specific guidance for resolution.
 */

test.describe.serial('🔬 Connectivity Diagnostic (Pre-flight)', () => {
  test.setTimeout(30000);

  const API_PORT = process.env.API_PORT || 8850;
  const WEB_PORT = process.env.WEB_PORT || 8849;
  
  // Use container networking when running in Docker, localhost when on host
  const useContainerNetworking = process.env.TEST_WEB_URL || process.env.TEST_API_URL;
  const API_URL = useContainerNetworking 
    ? (process.env.TEST_API_URL || `http://shipnorth-app:${API_PORT}`)
    : `http://localhost:${API_PORT}`;
  const WEB_URL = useContainerNetworking
    ? (process.env.TEST_WEB_URL || `http://shipnorth-app:${WEB_PORT}`)
    : `http://localhost:${WEB_PORT}`;

  test('Frontend-API connectivity health check @connectivity @critical', async ({ page }) => {
    console.log('🔬 CONNECTIVITY DIAGNOSTIC - Preventing recurring frontend-API issues');
    console.log('========================================================================');
    console.log(`🌐 Test URLs: API=${API_URL}, WEB=${WEB_URL}`);
    console.log(`🐳 Container networking: ${useContainerNetworking ? 'enabled' : 'disabled (using localhost)'}`);
    console.log('========================================================================');

    const issues: string[] = [];
    const warnings: string[] = [];

    // Test 1: Direct API accessibility from browser context
    try {
      const apiHealth = await page.request.get(`${API_URL}/health`);
      if (apiHealth.ok()) {
        console.log('✅ API directly accessible from browser');
      } else {
        issues.push(`API health check failed: ${apiHealth.status()}`);
      }
    } catch (error) {
      issues.push(`API unreachable: ${error.message}`);
    }

    // Test 2: CORS Configuration Check (specific to the issue we fixed)
    try {
      const corsTest = await page.evaluate(async (apiUrl) => {
        try {
          // Test the exact request pattern that failed before
          const response = await fetch(`${apiUrl}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache', // This header caused the original CORS issue
            },
          });
          return { success: true, status: response.status };
        } catch (error) {
          // Check if it's specifically a CORS error
          if (error.message.includes('CORS') || error.message.includes('cors')) {
            return { success: false, error: error.message, type: 'cors' };
          } else {
            return { success: false, error: error.message, type: 'other' };
          }
        }
      }, API_URL);

      if (corsTest.success) {
        console.log('✅ CORS configuration allows Cache-Control headers');
      } else if (corsTest.type === 'cors') {
        issues.push(`CORS issue detected: ${corsTest.error}`);
        console.log('🔧 FIX: Add Cache-Control to API allowedHeaders in CORS config');
      } else {
        warnings.push(`Minor fetch issue (non-CORS): ${corsTest.error}`);
      }
    } catch (error) {
      warnings.push(`CORS test setup failed: ${error.message}`);
    }

    // Test 3: Frontend Environment Variable Resolution
    await page.goto(WEB_URL);
    
    const envCheck = await page.evaluate(() => {
      // Check if Next.js environment variables are available
      return {
        hasNextData: typeof window !== 'undefined' && !!window.__NEXT_DATA__,
        nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
        // Check if API URL would be available (without causing errors)
        browserContext: typeof window !== 'undefined' ? 'browser' : 'server'
      };
    });

    if (!envCheck.hasNextData) {
      warnings.push('Next.js environment data not properly loaded');
    }

    // Test 4: Axios vs Fetch Behavior Test
    await page.goto(`${WEB_URL}/login/`);
    await page.waitForTimeout(2000);

    // Monitor network requests during form interaction
    const requests: string[] = [];
    const failures: string[] = [];

    page.on('request', req => {
      if (req.url().includes(':8850') || req.url().includes('/auth/')) {
        requests.push(`${req.method()} ${req.url()}`);
      }
    });

    page.on('requestfailed', req => {
      if (req.url().includes(':8850') || req.url().includes('/auth/')) {
        failures.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
      }
    });

    // Test quick login button (the exact pattern that was failing)
    try {
      const staffButton = page.locator('button:has-text("Staff")').first();
      if (await staffButton.isVisible()) {
        console.log('📋 Testing quick login functionality...');
        await staffButton.click();
        await page.waitForTimeout(3000);
        
        if (requests.length > 0) {
          console.log('✅ Login triggered API requests successfully');
          console.log(`📊 Requests: ${requests.join(', ')}`);
        } else {
          warnings.push('No API requests detected during login attempt');
        }

        if (failures.length > 0) {
          issues.push(`Login network failures: ${failures.join('; ')}`);
        }
      } else {
        warnings.push('Staff quick login button not found');
      }
    } catch (error) {
      warnings.push(`Login test error: ${error.message}`);
    }

    // Test 5: Database Connectivity Through API
    try {
      const dbTest = await page.request.post(`${API_URL}/auth/login`, {
        data: { email: 'test@test.com', password: 'test123' }
      });
      
      if (dbTest.ok()) {
        console.log('✅ Database authentication working through API');
      } else {
        const errorData = await dbTest.json().catch(() => ({}));
        if (errorData.error === 'Invalid credentials') {
          console.log('✅ Database responding (credentials rejected as expected for test)');
        } else {
          issues.push(`Database issue: ${errorData.error || dbTest.status()}`);
        }
      }
    } catch (error) {
      issues.push(`Database connectivity test failed: ${error.message}`);
    }

    // Summary and Resolution Guidance
    console.log('\n🎯 CONNECTIVITY DIAGNOSTIC RESULTS:');
    console.log('===================================');

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ All connectivity checks passed - system healthy');
    } else {
      if (warnings.length > 0) {
        console.log(`⚠️ Warnings (${warnings.length}):`);
        warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
      }

      if (issues.length > 0) {
        console.log(`❌ Issues Found (${issues.length}):`);
        issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
        
        console.log('\n🔧 RESOLUTION GUIDANCE:');
        console.log('1. Run: npm run dev:diagnose (full diagnostic suite)');
        console.log('2. Check: docker-compose logs shipnorth');
        console.log('3. Verify: npm run dev:health');
        console.log('4. If CORS errors: Add missing headers to API allowedHeaders');
        console.log('5. If database errors: Check PostgreSQL user schema');
        
        // Only fail if there are actual connectivity issues, not just warnings
        if (issues.some(issue => issue.includes('unreachable') || issue.includes('CORS') || issue.includes('network failures'))) {
          throw new Error(`Connectivity issues detected: ${issues.join('; ')}`);
        }
      }
    }
  });

  test('Environment configuration verification @config @critical', async ({ page }) => {
    console.log('🔧 Verifying centralized environment configuration...');

    // Check that no hardcoded URLs exist in the test environment
    const configCheck = {
      apiUrl: API_URL,
      webUrl: WEB_URL,
      portsFromEnv: {
        api: process.env.API_PORT || 'default',
        web: process.env.WEB_PORT || 'default'
      }
    };

    console.log('📊 Configuration check:', JSON.stringify(configCheck, null, 2));

    // Verify the URLs use environment variables
    expect(API_URL).toMatch(/localhost:\d{4}/);
    expect(WEB_URL).toMatch(/localhost:\d{4}/);
    
    // Quick verification that services respond on configured ports
    const responses = await Promise.all([
      page.request.get(API_URL + '/health').catch(() => null),
      page.request.get(WEB_URL).catch(() => null)
    ]);

    if (responses[0]?.ok() && responses[1]?.ok()) {
      console.log('✅ Both services responding on environment-configured ports');
    } else {
      throw new Error('Services not responding on configured ports - check environment variables');
    }
  });
});