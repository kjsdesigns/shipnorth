import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Docker-compatible Playwright Configuration
 * Tests API health and basic connectivity only
 */

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['docker-verification.spec.ts'],

  timeout: 15000,
  globalTimeout: 120000,
  workers: 2,
  retries: 0,

  reporter: [
    ['list', { printSteps: true }],
    ['json', { outputFile: 'test-reports/simple-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:8849', // Test web service
    headless: true,
    ignoreHTTPSErrors: true,
  },

  outputDir: 'test-artifacts-simple',

  projects: [
    {
      name: 'api-health',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
          ]
        }
      },
    },
  ],
});