import { defineConfig, devices } from '@playwright/test';
import { config as testConfig } from './tests/e2e/config';

/**
 * Playwright Configuration for Modular E2E Test Suite
 *
 * Optimized for parallel execution of 9 comprehensive test modules:
 * 1. auth.spec.ts - Authentication & session management
 * 2. staff-interface.spec.ts - Staff dashboard functionality
 * 3. customer-portal.spec.ts - Customer portal & tracking
 * 4. driver-mobile.spec.ts - Driver mobile interface & workflows
 * 5. admin-panel.spec.ts - Admin interface & user management
 * 6. documentation.spec.ts - Documentation site & search
 * 7. api-integration.spec.ts - API functionality & data consistency
 * 8. ui-ux.spec.ts - UI/UX, themes, accessibility & responsive design
 * 9. end-to-end.spec.ts - Complete business workflows
 */

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    // Priority 0: Connectivity diagnostic (runs first)
    '00-connectivity-diagnostic.spec.ts',
    
    // Data verification test
    'verify-dummy-data.spec.ts',
    
    // Package functionality tests
    'bulk-package-assignment.spec.ts',
    'package-creation-workflow.spec.ts',
    
    // Main test suite
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
    '**/apps/api/src/tests/**',
    '**/src/tests/**',
    '**/backup-original/**',
    '**/backup-corrupted/**',
    '**/*-old.spec.ts',
    '**/*-debug.spec.ts',
    '**/*-comprehensive*.spec.ts',
    '**/*-consolidated*.spec.ts',
    '**/basic-*.spec.ts',
    '**/complete-workflow-test.spec.ts',
    '**/comprehensive-*.spec.ts',
    '**/fixed-workflow-test.spec.ts',
    '**/global-search.spec.ts',
    '**/theme-toggle.spec.ts',
    '**/ui-theme.spec.ts',
    '**/user-management.spec.ts',
    '**/web-interface.spec.ts',
    '**/MODULAR_*.md',
  ],

  // Optimized parallel execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 3 : 6, // Increased workers for better parallelization
  timeout: 90000, // Generous timeout for comprehensive tests
  globalTimeout: 45 * 60 * 1000, // 45 minutes total
  expect: {
    timeout: 15000, // Assertion timeout
  },

  // Enhanced reporting with separate output directories
  reporter: [
    ['list', { printSteps: true }],
    [
      'json',
      {
        outputFile: 'test-reports/results.json',
        includeProjectInTestName: true,
      },
    ],
    [
      'html',
      {
        outputFolder: 'test-reports/html-report',
        open: 'never',
        host: 'localhost',
        port: 9323,
      },
    ],
    ['junit', { outputFile: 'test-reports/junit-results.xml' }],
    ['github'], // GitHub Actions integration
  ],

  use: {
    // Environment-based URL configuration from shared config
    baseURL: testConfig.webUrl,

    // Enhanced debugging and reporting
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,

    // Performance optimization
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Default headers
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Shipnorth-E2E-Tests/1.0',
    },

    // Viewport defaults
    viewport: { width: 1280, height: 720 },

    // Locale and timezone
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  },

  projects: [
    // Infrastructure Check - MANDATORY first step before any tests
    {
      name: 'infrastructure',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: ['00-connectivity-diagnostic.spec.ts', 'infrastructure-check.spec.ts', 'config-enforcement.spec.ts'],
      retries: 0, // No retries - if infrastructure fails, fix it
      timeout: 60000,
      fullyParallel: false,
    },

    // Smoke Tests - Critical path verification (runs after infrastructure)
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: ['auth.spec.ts', 'staff-interface.spec.ts', 'customer-portal.spec.ts'],
      grep: /@smoke/,
      retries: 1,
      timeout: 30000,
      dependencies: ['infrastructure'],
    },

    // Core Desktop Tests - Main functionality
    {
      name: 'desktop-core',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: [
        'auth.spec.ts',
        'staff-interface.spec.ts',
        'customer-portal.spec.ts',
        'admin-panel.spec.ts',
      ],
      dependencies: ['infrastructure', 'smoke'],
    },

    // API and Integration Tests - Backend verification
    {
      name: 'api-integration',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: ['api-integration.spec.ts'],
      dependencies: ['infrastructure', 'smoke'],
    },

    // Documentation Tests - Content and search
    {
      name: 'documentation',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: ['documentation.spec.ts'],
      dependencies: ['infrastructure', 'smoke'],
    },

    // Mobile Tests - Touch interfaces and responsive design
    {
      name: 'mobile-core',
      use: { ...devices['Pixel 5'] },
      testDir: './tests/e2e',
      testMatch: ['customer-portal.spec.ts', 'driver-mobile.spec.ts', 'ui-ux.spec.ts'],
      dependencies: ['infrastructure', 'smoke'],
    },

    // Cross-browser Tests - Safari compatibility
    {
      name: 'safari-desktop',
      use: { ...devices['Desktop Safari'] },
      testDir: './tests/e2e',
      testMatch: ['auth.spec.ts', 'customer-portal.spec.ts', 'ui-ux.spec.ts'],
      dependencies: ['desktop-core'],
    },

    // Mobile Safari Tests - iOS compatibility
    {
      name: 'safari-mobile',
      use: { ...devices['iPhone 12'] },
      testDir: './tests/e2e',
      testMatch: ['customer-portal.spec.ts', 'driver-mobile.spec.ts'],
      dependencies: ['mobile-core'],
    },

    // Tablet Tests - Medium viewport testing
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
      testDir: './tests/e2e',
      testMatch: ['staff-interface.spec.ts', 'admin-panel.spec.ts', 'ui-ux.spec.ts'],
      dependencies: ['desktop-core'],
    },

    // E2E Business Workflows - Complete user journeys (runs last)
    {
      name: 'end-to-end',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/e2e',
      testMatch: ['end-to-end.spec.ts'],
      dependencies: ['desktop-core', 'mobile-core'],
      timeout: 120000, // Extended timeout for complex workflows
      retries: 2,
    },
  ],

  // Global setup and teardown (optional if files exist)
  // globalSetup: require.resolve('./tests/e2e/utils/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/utils/global-teardown.ts'),

  // Only use webServer for local testing (Docker-based)
  ...(process.env.TEST_ENV !== 'dev' && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:8849',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  }),

  // Output directories - separated to avoid conflicts
  outputDir: 'test-artifacts',

  // Metadata
  metadata: {
    testSuite: 'Shipnorth E2E Tests',
    version: '2.0.0',
    modular: true,
    totalTests: 9,
  },
});
