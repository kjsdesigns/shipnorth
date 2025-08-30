import { defineConfig, devices } from '@playwright/test';

/**
 * Stable Stack Playwright Configuration
 * Optimized for Fastify + Vite + PostgreSQL architecture
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  // All important test files - complete coverage
  testMatch: [
    'debug-login-flow.spec.ts',    // Debug complete login flow
    'comprehensive-status.spec.ts', // Master status check
    'debug-staff-page.spec.ts',    // Debug staff page rendering
    'debug-login-buttons.spec.ts', // Debug login structure
    'debug-runtime-errors.spec.ts', // Debug React runtime issues
    'docker-verification.spec.ts', // Infrastructure verification
    'auth.spec.ts',                // Authentication (core functionality)
    'staff-interface.spec.ts',     // Staff portal functionality  
    'customer-portal.spec.ts',     // Customer portal functionality
    'driver-mobile.spec.ts',       // Driver interface
    'admin-panel.spec.ts',         // Admin functionality
    'api-integration.spec.ts',     // API backend tests
    'documentation.spec.ts',       // Documentation site
    'ui-ux.spec.ts',              // UI/UX and themes
    'end-to-end.spec.ts',         // Complete workflows
  ],

  timeout: 15000, // Shorter timeout for faster services
  globalTimeout: 300000, // 5 minutes total
  workers: 4, // Reduced workers for stability
  fullyParallel: true,
  retries: 1,

  expect: {
    timeout: 10000, // Faster assertions for stable services
  },

  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-reports/stable-results.json' }],
    ['html', { outputFolder: 'test-reports/stable-html', open: 'never' }],
  ],

  use: {
    // Use localhost URLs directly
    baseURL: 'http://localhost:8849',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true, // Always headless in Docker
  },

  outputDir: 'test-artifacts-stable',

  projects: [
    {
      name: 'stable-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system Chromium for Docker compatibility
        launchOptions: {
          executablePath: '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
          ]
        }
      },
    },
  ],

  metadata: {
    testSuite: 'Shipnorth Stable Stack Tests',
    architecture: 'Fastify + Vite + PostgreSQL + localhost',
    optimizations: [
      'System Chromium for Alpine Linux compatibility',
      'Reduced timeouts for faster stable services',
      'Docker-optimized configuration',
      'PostgreSQL backend integration',
    ],
  },
});