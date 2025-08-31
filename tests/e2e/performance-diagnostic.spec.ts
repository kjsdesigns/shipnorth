import { test, expect } from '@playwright/test';

/**
 * Performance Diagnostic Test Suite
 * Systematically tests performance hypotheses to identify root causes
 */

test.describe.serial('🔬 Performance Diagnostic', () => {
  test.setTimeout(60000);

  const API_PORT = process.env.API_PORT || 8850;
  const WEB_PORT = process.env.WEB_PORT || 8849;
  const API_URL = `http://localhost:${API_PORT}`;
  const WEB_URL = `http://localhost:${WEB_PORT}`;

  test('Hypothesis 1-2: API and Frontend Performance Baseline', async ({ page }) => {
    console.log('🧪 Testing API and Frontend response times...');

    const results = {
      apiHealth: 0,
      apiCustomers: 0,
      frontendCold: 0,
      frontendWarm: 0,
      staticAssets: []
    };

    // Test API performance
    console.log('📊 Testing API endpoints...');
    
    const apiStart = Date.now();
    const healthResponse = await page.request.get(`${API_URL}/health`);
    results.apiHealth = Date.now() - apiStart;
    console.log(`   API Health: ${results.apiHealth}ms (${healthResponse.status()})`);

    const customersStart = Date.now();
    const customersResponse = await page.request.get(`${API_URL}/customers`);
    results.apiCustomers = Date.now() - customersStart;
    console.log(`   API Customers: ${results.apiCustomers}ms (${customersResponse.status()})`);

    // Test frontend performance (cold load)
    console.log('📊 Testing frontend cold load...');
    const coldStart = Date.now();
    await page.goto(WEB_URL);
    await page.waitForLoadState('domcontentloaded');
    results.frontendCold = Date.now() - coldStart;
    console.log(`   Frontend Cold: ${results.frontendCold}ms`);

    // Test frontend performance (warm load)
    console.log('📊 Testing frontend warm load...');
    const warmStart = Date.now();
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    results.frontendWarm = Date.now() - warmStart;
    console.log(`   Frontend Warm: ${results.frontendWarm}ms`);

    // Performance analysis
    console.log('\n🎯 Performance Analysis:');
    
    if (results.apiHealth > 500) {
      console.log(`❌ API Health slow: ${results.apiHealth}ms (target: <500ms)`);
    } else {
      console.log(`✅ API Health good: ${results.apiHealth}ms`);
    }

    if (results.apiCustomers > 1000) {
      console.log(`❌ API Customers slow: ${results.apiCustomers}ms (target: <1000ms)`);
    } else {
      console.log(`✅ API Customers good: ${results.apiCustomers}ms`);
    }

    const compilationOverhead = results.frontendCold - results.frontendWarm;
    console.log(`📊 Compilation overhead: ${compilationOverhead}ms`);
    
    if (compilationOverhead > 2000) {
      console.log(`❌ High compilation overhead: ${compilationOverhead}ms`);
    } else {
      console.log(`✅ Acceptable compilation overhead: ${compilationOverhead}ms`);
    }
  });

  test('Hypothesis 3: Static Asset Load Performance', async ({ page }) => {
    console.log('🧪 Testing static asset load performance...');

    const assetTimes: any[] = [];

    // Monitor all requests during page load
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/_next/static/') || url.includes('.css') || url.includes('.js')) {
        const timing = response.timing();
        assetTimes.push({
          url: url.substring(url.lastIndexOf('/') + 1),
          status: response.status(),
          responseTime: timing.responseEnd
        });
      }
    });

    await page.goto(WEB_URL);
    await page.waitForLoadState('networkidle');

    console.log('\n📊 Static Asset Performance:');
    assetTimes.forEach(asset => {
      const status = asset.responseTime > 1000 ? '❌' : asset.responseTime > 500 ? '⚠️' : '✅';
      console.log(`   ${status} ${asset.url}: ${asset.responseTime}ms`);
    });

    const slowAssets = assetTimes.filter(asset => asset.responseTime > 1000);
    if (slowAssets.length > 0) {
      console.log(`❌ Found ${slowAssets.length} slow assets (>1000ms)`);
    } else {
      console.log(`✅ All assets load efficiently (<1000ms)`);
    }
  });

  test('Hypothesis 4-5: Browser Performance Metrics', async ({ page }) => {
    console.log('🧪 Testing browser performance metrics...');

    await page.goto(WEB_URL);
    await page.waitForLoadState('networkidle');

    // Get detailed performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        
        // DNS and connection
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        
        // Request/response
        requestTime: navigation.responseStart - navigation.requestStart,
        responseTime: navigation.responseEnd - navigation.responseStart,
        
        // DOM processing
        domProcessing: navigation.domComplete - navigation.domLoading,
        
        // Paint timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource timing
        resourceCount: performance.getEntriesByType('resource').length
      };
    });

    console.log('\n📊 Detailed Performance Breakdown:');
    console.log(`   DNS Lookup: ${performanceMetrics.dnsLookup.toFixed(2)}ms`);
    console.log(`   TCP Connect: ${performanceMetrics.tcpConnect.toFixed(2)}ms`);
    console.log(`   Request Time: ${performanceMetrics.requestTime.toFixed(2)}ms`);
    console.log(`   Response Time: ${performanceMetrics.responseTime.toFixed(2)}ms`);
    console.log(`   DOM Processing: ${performanceMetrics.domProcessing.toFixed(2)}ms`);
    console.log(`   First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
    console.log(`   First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Resources Loaded: ${performanceMetrics.resourceCount}`);

    // Identify bottlenecks
    console.log('\n🎯 Bottleneck Analysis:');
    
    if (performanceMetrics.dnsLookup > 100) {
      console.log(`❌ DNS lookup slow: ${performanceMetrics.dnsLookup.toFixed(2)}ms`);
    }
    
    if (performanceMetrics.tcpConnect > 100) {
      console.log(`❌ TCP connection slow: ${performanceMetrics.tcpConnect.toFixed(2)}ms`);
    }
    
    if (performanceMetrics.responseTime > 1000) {
      console.log(`❌ Server response slow: ${performanceMetrics.responseTime.toFixed(2)}ms`);
    }
    
    if (performanceMetrics.domProcessing > 2000) {
      console.log(`❌ DOM processing slow: ${performanceMetrics.domProcessing.toFixed(2)}ms`);
    }
    
    if (performanceMetrics.firstContentfulPaint > 3000) {
      console.log(`❌ First Contentful Paint slow: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    }

    // Overall assessment
    const totalTime = performanceMetrics.loadComplete;
    if (totalTime > 3000) {
      console.log(`❌ CONFIRMED: Page load slow (${totalTime.toFixed(2)}ms > 3000ms target)`);
    } else {
      console.log(`✅ REJECTED: Page load within targets (${totalTime.toFixed(2)}ms)`);
    }
  });

  test('Hypothesis 6-7: Resource and Rate Limiting Analysis', async ({ page }) => {
    console.log('🧪 Testing resource loading and rate limiting...');

    const requestTimes: number[] = [];
    const failedRequests: string[] = [];

    page.on('response', response => {
      const timing = response.timing();
      requestTimes.push(timing.responseEnd);
      
      if (!response.ok()) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', request => {
      failedRequests.push(`FAILED ${request.url()}`);
    });

    // Load a complex page with many resources
    await page.goto(`${WEB_URL}/staff`);
    await page.waitForLoadState('networkidle');

    // Calculate statistics
    const avgRequestTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
    const maxRequestTime = Math.max(...requestTimes);
    const slowRequests = requestTimes.filter(time => time > 1000).length;

    console.log('\n📊 Resource Loading Analysis:');
    console.log(`   Total Requests: ${requestTimes.length}`);
    console.log(`   Average Request Time: ${avgRequestTime.toFixed(2)}ms`);
    console.log(`   Max Request Time: ${maxRequestTime.toFixed(2)}ms`);
    console.log(`   Slow Requests (>1s): ${slowRequests}`);
    console.log(`   Failed Requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach(req => console.log(`     ${req}`));
    }

    // Hypothesis conclusions
    if (avgRequestTime > 500) {
      console.log(`❌ CONFIRMED: Average request time slow (${avgRequestTime.toFixed(2)}ms)`);
    } else {
      console.log(`✅ REJECTED: Request times acceptable`);
    }

    if (slowRequests > 3) {
      console.log(`❌ CONFIRMED: Multiple slow requests (${slowRequests} > 3)`);
    } else {
      console.log(`✅ REJECTED: Few slow requests`);
    }
  });
});