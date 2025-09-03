import { defineConfig, devices } from '@playwright/test';
import { config as testConfig } from './tests/e2e/config';
import DockerEnvironmentChecker from './tests/utils/docker-environment-check';

/**
 * DOCKER-ONLY PLAYWRIGHT CONFIGURATION
 * 
 * This configuration enforces Docker environment execution and will 
 * refuse to run tests locally to ensure consistent test environment.
 */

// Enforce Docker environment before any tests run
DockerEnvironmentChecker.enforceDockerOnly('Docker-Only Test Suite');

export default defineConfig({
  testDir: './tests/e2e',
  
  // Docker-only test selection
  testMatch: [
    // Infrastructure verification
    '00-connectivity-diagnostic.spec.ts',
    'infrastructure-check.spec.ts',
    
    // Data verification
    'verify-dummy-data.spec.ts',
    
    // Full test suite
    'optimized-test-suite.spec.ts',
    'auth.spec.ts',
    'staff-interface.spec.ts', 
    'customer-portal.spec.ts',
    'driver-mobile.spec.ts',
    'admin-panel.spec.ts',
    'documentation.spec.ts',
    'api-integration.spec.ts',
    'ui-ux.spec.ts',
    'end-to-end.spec.ts',
  ],

  testIgnore: [
    '**/node_modules/**',
    '**/backup-**/**',
    '**/*-debug.spec.ts',
    '**/*-local.spec.ts', // Exclude local-specific tests
  ],

  // Optimized for Docker environment
  fullyParallel: true,
  forbidOnly: true, // Prevent .only() in CI-like Docker environment
  retries: 3, // More retries in Docker for stability
  workers: 3, // Conservative worker count for Docker
  timeout: 120000, // Longer timeout for Docker overhead
  globalTimeout: 60 * 60 * 1000, // 1 hour total
  expect: {
    timeout: 20000, // Docker can be slower for assertions
  },

  // Enhanced reporting for Docker environment
  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-reports/docker-results.json' }],
    ['html', { 
      outputFolder: 'test-reports/docker-html-report',
      open: 'never' // Never auto-open in Docker
    }],
    ['junit', { outputFile: 'test-reports/docker-junit.xml' }],
  ],

  use: {
    // Docker container network URLs (use localhost since we're in host network mode)
    baseURL: 'http://localhost:8849',
    
    // Enhanced tracing for Docker debugging
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure', 
    video: 'retain-on-failure',
    
    // Docker-optimized settings with longer timeouts
    actionTimeout: 20000,
    navigationTimeout: 45000,
    
    // Container-specific browser settings for maximum compatibility
    launchOptions: {
      headless: true, // Force headless mode in container
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    },
    
    // Output directory for Docker
    outputDir: 'test-artifacts-docker',
  },

  // Projects optimized for Docker execution
  projects: [
    {
      name: 'docker-infrastructure',
      testMatch: ['00-connectivity-diagnostic.spec.ts', 'infrastructure-check.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'docker-core',
      testMatch: ['verify-dummy-data.spec.ts', 'optimized-test-suite.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['docker-infrastructure'],
    },
    {
      name: 'docker-auth',
      testMatch: ['auth.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['docker-core'],
    },
    {
      name: 'docker-portals',
      testMatch: ['staff-interface.spec.ts', 'customer-portal.spec.ts', 'admin-panel.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['docker-auth'],
    },
    {
      name: 'docker-workflows',
      testMatch: ['driver-mobile.spec.ts', 'end-to-end.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['docker-portals'],
    },
    {
      name: 'docker-integration',
      testMatch: ['api-integration.spec.ts', 'documentation.spec.ts', 'ui-ux.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['docker-workflows'],
    },
  ],

  // Global setup to log Docker environment info
  globalSetup: require.resolve('./tests/utils/docker-global-setup.ts'),
});