import { test } from '@playwright/test';

test('Debug React rendering errors', async ({ page }) => {
  console.log('🔍 Checking React app rendering...');
  
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ React Error:', msg.text());
    }
  });
  
  // Go to homepage
  const webUrl = `http://localhost:${process.env.WEB_PORT || 8849}`;
  await page.goto(webUrl);
  await page.waitForTimeout(3000);
  
  // Check if React mounted
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root div content:', rootContent.slice(0, 200));
  
  // Check for any visible content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text:', bodyText?.slice(0, 100));
  
  console.log('Total errors found:', errors.length);
  errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
});