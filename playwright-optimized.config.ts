import { defineConfig, devices } from '@playwright/test';
import { config as testConfig } from './tests/e2e/config';

/**
 * OPTIMIZED PLAYWRIGHT CONFIGURATION
 *
 * Strategic improvements:
 * 1. Priority-based test execution order
 * 2. Increased parallelism for faster execution
 * 3. Focused test projects for different purposes
 * 4. Efficient output directory structure
 * 5. Reduced redundancy and consolidated test sequences
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Prioritized test execution
  testMatch: [
    // Priority 1: New optimized test suite (runs first)
    'optimized-test-suite.spec.ts',

    // Priority 2: Core functionality (if time allows)
    'auth.spec.ts',
    'customer-portal.spec.ts',
    'staff-interface.spec.ts',

    // Priority 3: Extended features (optional)
    'driver-mobile.spec.ts',
    'ui-ux.spec.ts',
    'documentation.spec.ts',
    'api-integration.spec.ts',
    'admin-panel.spec.ts',
    'end-to-end.spec.ts',
  ],

  testIgnore: [
    '**/node_modules/**',
    '**/apps/api/src/tests/**',
    '**/src/tests/**',
    '**/backup-original/**',
    '**/backup-corrupted/**',
    '**/backup-legacy/**',
    '**/*-old.spec.ts',
    '**/*-debug.spec.ts',
    '**/*-comprehensive*.spec.ts',
    '**/*-consolidated*.spec.ts',
    '**/basic-*.spec.ts',
    '**/complete-workflow-test.spec.ts',
    '**/fixed-workflow-test.spec.ts',
    '**/final-verification.spec.ts',
    '**/manual-check.spec.ts',
    '**/simple-verification.spec.ts',
  ],

  // Performance settings for faster execution
  timeout: 30000,
  globalTimeout: 600000, // 10 minutes max
  workers: process.env.CI ? 4 : 6, // More parallelism
  fullyParallel: true,
  retries: 1, // Reduced retries for faster feedback

  expect: {
    timeout: 15000,
  },

  // Optimized reporting - separate directories to avoid conflicts
  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-reports/optimized-results.json' }],
    ['html', { outputFolder: 'test-reports/optimized-html', open: 'never' }],
    ['junit', { outputFile: 'test-reports/optimized-junit.xml' }],
  ],

  use: {
    baseURL: testConfig.webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,
  },

  // Output directories - optimized structure
  outputDir: 'test-artifacts-optimized',

  projects: [
    // Priority execution order
    {
      name: 'critical-path',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['optimized-test-suite.spec.ts'],
      retries: 0, // Fast failure for critical issues
      timeout: 45000,
    },

    {
      name: 'core-functionality',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['auth.spec.ts', 'customer-portal.spec.ts', 'staff-interface.spec.ts'],
      dependencies: ['critical-path'], // Run after critical path passes
      grep: /@smoke|@core/,
      timeout: 30000,
    },

    {
      name: 'extended-features',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['driver-mobile.spec.ts', 'ui-ux.spec.ts', 'api-integration.spec.ts'],
      dependencies: ['core-functionality'],
      timeout: 25000,
      retries: 0, // Fail fast on extended features
    },

    // Mobile testing (runs in parallel with desktop when possible)
    {
      name: 'mobile-verification',
      use: { ...devices['iPhone 12'] },
      testMatch: ['optimized-test-suite.spec.ts'],
      grep: /@mobile|@accessibility/,
      timeout: 20000,
    },
  ],

  metadata: {
    testSuite: 'Shipnorth Optimized E2E Tests',
    strategy: 'Priority-based execution with consolidated test sequences',
    improvements: [
      'Reduced redundant authentication steps',
      'Consolidated portal journeys into single browser sessions',
      'Priority-based test ordering for faster root cause detection',
      'Increased parallelism',
      'Comprehensive page load verification',
      'Focused failure detection',
    ],
  },
});
