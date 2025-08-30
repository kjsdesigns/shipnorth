import { defineConfig, devices } from '@playwright/test';
import { config as testConfig } from './tests/e2e/config';

/**
 * Docker-optimized Playwright Configuration
 * Uses system-installed Chromium for Alpine Linux compatibility
 */

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'auth.spec.ts',
    'staff-interface.spec.ts', 
    'customer-portal.spec.ts',
    'driver-mobile.spec.ts',
    'admin-panel.spec.ts',
    'documentation.spec.ts',
    'api-integration.spec.ts',
    'ui-ux.spec.ts',
    'end-to-end.spec.ts'
  ],

  timeout: 30000,
  globalTimeout: 600000, 
  workers: 6,
  fullyParallel: true,
  retries: 1,

  expect: {
    timeout: 15000,
  },

  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-reports/docker-results.json' }],
    ['html', { outputFolder: 'test-reports/docker-html', open: 'never' }],
    ['junit', { outputFile: 'test-reports/docker-junit.xml' }],
  ],

  use: {
    baseURL: 'http://172.18.0.2:8849',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },

  outputDir: 'test-artifacts-docker',

  projects: [
    {
      name: 'docker-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use system Chromium
        launchOptions: {
          executablePath: '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ]
        }
      },
    },
  ],
});