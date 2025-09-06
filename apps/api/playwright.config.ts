import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/apps/**', '**/node_modules/**', '**/infrastructure/**'],
  fullyParallel: false, // Sequential for auth/portal tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for auth/portal tests
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-reports/html-report' }],
    ['json', { outputFile: 'test-reports/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:8849',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
    },
    {
      name: 'webkit',  
      use: { ...devices['Desktop Safari'], headless: true },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], headless: true },
    },
  ],

  timeout: 120000, // 2 minute timeout per test
  expect: {
    timeout: 15000
  }
});
