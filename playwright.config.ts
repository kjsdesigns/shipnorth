import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/node_modules/**', '**/apps/api/src/tests/**', '**/src/tests/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_ENV === 'dev' 
      ? 'https://dfuxgr1ixgyo2.cloudfront.net'
      : 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only use webServer for local testing
  ...(process.env.TEST_ENV !== 'dev' && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  }),
});