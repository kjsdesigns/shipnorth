import { test } from '@playwright/test';

test('Debug login button structure', async ({ page }) => {
  console.log('🔍 Analyzing login page button structure...');
  
  await page.goto('http://localhost:8849/login');
  await page.waitForTimeout(3000);
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if welcome text is there
  const welcomeVisible = await page.locator('h2:has-text("Welcome back")').isVisible();
  console.log('Welcome heading visible:', welcomeVisible);
  
  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('Total buttons found:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const ariaLabel = await button.getAttribute('aria-label');
    const accessibleName = await button.getAttribute('aria-label') || await button.textContent();
    
    console.log(`Button ${i + 1}:`);
    console.log(`  Text: "${text}"`);
    console.log(`  Aria-label: "${ariaLabel}"`);
    console.log(`  Accessible name: "${accessibleName}"`);
  }
  
  // Test specific selector
  const staffButton = page.getByRole('button', { name: 'Staff', exact: true });
  const staffVisible = await staffButton.isVisible();
  console.log('Staff button (exact) visible:', staffVisible);
  
  // Test alternative selectors
  const staffAlt1 = page.locator('button:has-text("Staff")').first();
  const staffAlt1Visible = await staffAlt1.isVisible();
  console.log('Staff button (has-text) visible:', staffAlt1Visible);
  
  const staffAlt2 = page.locator('button').filter({ hasText: 'Staff' }).first();
  const staffAlt2Visible = await staffAlt2.isVisible();
  console.log('Staff button (filter) visible:', staffAlt2Visible);
});