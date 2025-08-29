import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright Test Setup...');

  const { baseURL } = config.projects[0].use;

  // Pre-warm the application if running locally
  if (baseURL?.includes('localhost')) {
    console.log('📡 Pre-warming local server...');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Visit homepage to warm up the server
      await page.goto(baseURL, { timeout: 30000 });
      console.log('✅ Server is ready');
    } catch (error) {
      console.warn('⚠️ Server pre-warm failed, continuing anyway:', error);
    } finally {
      await browser.close();
    }
  }

  console.log('🏁 Test setup complete');
}

export default globalSetup;
