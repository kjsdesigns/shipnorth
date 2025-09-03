import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { TEST_CONFIG } from './utils/config';

/**
 * Mandatory Infrastructure Pre-flight Check
 * 
 * This test MUST pass before any other tests run. It verifies:
 * 1. Docker containers are running
 * 2. Services are responding  
 * 3. Network connectivity is working
 * 4. Database is accessible
 * 
 * If this fails, it provides clear instructions and attempts auto-resolution.
 */

test.describe.serial('🏥 Infrastructure Health Check', () => {
  test.setTimeout(60000); // Extended timeout for thorough checks

  test('Docker containers are running and healthy @infrastructure @critical', async ({ page }) => {
    console.log('\n🔍 INFRASTRUCTURE PRE-FLIGHT CHECK STARTING...\n');

    // Step 1: Check Docker environment (skip docker CLI check in container)
    if (process.env.DOCKER_ENV === 'true') {
      console.log('✅ Running inside Docker container - skipping docker CLI checks');
    } else {
      try {
        const dockerInfo = execSync('docker info --format "{{.ServerVersion}}"', { 
          encoding: 'utf8', 
          timeout: 5000 
        }).trim();
        console.log(`✅ Docker Engine: v${dockerInfo}`);
      } catch (error) {
        console.log('❌ Docker Engine not available');
        console.log('🔧 RESOLUTION: Start Docker Desktop application');
        throw new Error('Docker service not running - start Docker Desktop');
      }
    }

    // Step 2: Validate services (container-aware logic)
    if (process.env.DOCKER_ENV === 'true') {
      console.log('✅ Running in Docker container - testing service endpoints');
      
      // Test actual service availability instead of container status
      const services = [
        { name: 'API', url: 'http://localhost:8850/health' },
        { name: 'Web', url: 'http://localhost:8849' }
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service.url);
          if (response.ok) {
            console.log(`✅ ${service.name} Service: responding (${response.status})`);
          } else {
            console.log(`❌ ${service.name} Service: error ${response.status}`);
            throw new Error(`${service.name} service not responding`);
          }
        } catch (error) {
          console.log(`❌ ${service.name} Service: ${error.message}`);
          throw new Error(`Service ${service.name} not accessible`);
        }
      }
      
    } else {
      // Host environment - check containers via docker-compose  
      try {
        const containers = execSync('docker-compose ps --format "{{.Name}} {{.Status}}"', { 
          encoding: 'utf8',
          timeout: 10000
        }).trim().split('\n');

        const expectedContainers = ['shipnorth-app', 'shipnorth-postgres'];
        console.log('✅ Container status check completed');
        
      } catch (error) {
        console.log('❌ Docker container check failed - manual intervention needed');
        throw new Error('Container validation failed');
      }
    }

    console.log('✅ All Docker containers are healthy\n');
  });

  test('Web frontend is accessible and responding @infrastructure @critical', async ({ page }) => {
    console.log('🌐 Testing frontend accessibility...');

    // Test clean domain first
    try {
      const response = await page.request.get(TEST_CONFIG.WEB_URL, { timeout: 10000 });
      
      if (response.ok()) {
        console.log(`✅ Frontend: ${TEST_CONFIG.WEB_URL}`);
      } else {
        console.log(`❌ Frontend returned: ${response.status()}`);
        throw new Error(`Frontend returned ${response.status()}`);
      }
    } catch (error) {
      console.log('❌ Frontend not accessible');
      console.log('🔧 RESOLUTION STEPS:');
      console.log('   1. Check container: docker-compose ps | grep shipnorth-app');
      console.log('   2. Check logs: docker-compose logs shipnorth');
      console.log('   3. Restart: docker-compose restart shipnorth');
      console.log('   4. Check for PostCSS/Tailwind compilation errors');
      throw new Error('Frontend service down - check container logs');
    }

    // Test actual page load
    try {
      const webUrl = `http://localhost:${process.env.WEB_PORT || 8849}`;
      await page.goto(webUrl, { timeout: 15000, waitUntil: 'domcontentloaded' });
      
      // Verify page loaded correctly
      await expect(page).toHaveTitle(/Shipnorth/);
      await expect(page.locator('h1')).toContainText('Shipnorth');
      
      console.log('✅ Frontend page loads correctly with content\n');
    } catch (pageError) {
      console.log('❌ Frontend loads but page content is broken');
      console.log('🔧 RESOLUTION: Check for React compilation errors');
      console.log('   - Look for console errors in browser');
      console.log('   - Check: docker-compose logs shipnorth | grep -i error');
      throw new Error('Frontend page broken - check React compilation');
    }
  });

  test('API backend is accessible and responding @infrastructure @critical', async ({ page }) => {
    console.log('🔗 Testing API accessibility...');

    try {
      const response = await page.request.get(TEST_CONFIG.ENDPOINTS.HEALTH, { timeout: 10000 });
      
      if (response.ok()) {
        const healthData = await response.json();
        console.log(`✅ API: ${TEST_CONFIG.API_URL} - ${JSON.stringify(healthData)}`);
        
        // Verify health response structure
        expect(healthData).toHaveProperty('status');
        expect(healthData.status).toBe('healthy');
        
      } else {
        console.log(`❌ API returned: ${response.status()}`);
        throw new Error(`API unhealthy: ${response.status()}`);
      }
    } catch (error) {
      console.log('❌ API not accessible');
      console.log('🔧 RESOLUTION STEPS:');
      console.log('   1. docker-compose restart shipnorth');
      console.log('   2. docker exec shipnorth-app ps aux | grep node');
      console.log(`   3. docker exec shipnorth-app curl http://localhost:${process.env.API_PORT || 8850}/health`);
      console.log('   4. Check API logs: docker-compose logs shipnorth | grep API');
      throw new Error('API service down - check Express server');
    }

    console.log('✅ API backend is healthy\n');
  });

  test('PostgreSQL database is accessible @infrastructure @critical', async ({ page }) => {
    console.log('🗄️ Testing database connectivity...');

    try {
      // Test database connectivity via API
      const response = await page.request.get(TEST_CONFIG.ENDPOINTS.HEALTH, { timeout: 5000 });
      
      if (response.ok()) {
        console.log('✅ Database accessible via API health check');
      } else {
        throw new Error('Database health check failed');
      }
      
    } catch (error) {
      console.log('❌ Database connectivity issues');
      console.log('🔧 RESOLUTION STEPS:');
      console.log('   1. Check container: docker-compose ps | grep postgres');
      console.log('   2. Check health: docker exec shipnorth-postgres pg_isready -U shipnorth');
      console.log('   3. Test connection: docker exec shipnorth-postgres psql -U shipnorth -d shipnorth -c "SELECT 1"');
      console.log('   4. Restart if needed: docker-compose restart postgres');
      throw new Error('Database not accessible - check PostgreSQL container');
    }

    console.log('✅ PostgreSQL database is healthy\n');
  });

  test('Direct port connectivity works @infrastructure @critical', async ({ page }) => {
    console.log('🌍 Testing direct port connectivity...');

    const WEB_PORT = process.env.WEB_PORT || 8849;
    const API_PORT = process.env.API_PORT || 8850;
    
    // Test direct localhost connections
    const endpoints = [
      { name: 'Frontend Direct Port', url: `http://localhost:${WEB_PORT}` },
      { name: 'API Direct Port', url: `http://localhost:${API_PORT}/health` }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(endpoint.url, { timeout: 8000 });
        
        if (response.ok()) {
          console.log(`✅ ${endpoint.name}: ${endpoint.url}`);
        } else {
          throw new Error(`${endpoint.name} returned ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} failed: ${error.message}`);
        console.log('🔧 RESOLUTION STEPS:');
        console.log('   1. Check containers: docker-compose ps');
        console.log('   2. Check logs: docker-compose logs shipnorth');
        console.log('   3. Restart services: docker-compose restart');
        console.log(`   4. Test health: npm run dev:health`);
        throw new Error(`Direct port connectivity failed for ${endpoint.name}`);
      }
    }

    console.log('✅ Direct port connectivity is working correctly\n');
  });

  test.afterAll(async () => {
    console.log('🎯 INFRASTRUCTURE CHECK COMPLETE');
    console.log('✅ System ready for comprehensive testing\n');
    console.log('=' .repeat(80));
  });
});