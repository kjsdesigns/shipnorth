import { test, expect } from '@playwright/test';

test('Debug complete login flow step by step', async ({ page }) => {
  console.log('🔍 DEBUGGING COMPLETE LOGIN FLOW');
  
  // Enable console logging
  page.on('console', msg => console.log(`Browser: ${msg.text()}`));
  page.on('request', req => console.log(`→ ${req.method()} ${req.url()}`));
  page.on('response', resp => console.log(`← ${resp.status()} ${resp.url()}`));
  
  console.log('Step 1: Going to login page...');
  const webUrl = `http://localhost:${process.env.WEB_PORT || 8849}`;
  await page.goto(`${webUrl}/login`);
  await page.waitForTimeout(2000);
  
  const loginUrl = page.url();
  console.log(`Current URL: ${loginUrl}`);
  
  console.log('Step 2: Looking for Staff button...');
  const staffButton = page.getByRole('button', { name: 'Staff', exact: true });
  const buttonVisible = await staffButton.isVisible();
  console.log(`Staff button visible: ${buttonVisible}`);
  
  if (!buttonVisible) {
    console.log('❌ Staff button not found - checking alternatives...');
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      console.log(`Button ${i + 1}: "${text}"`);
    }
    return;
  }
  
  console.log('Step 3: Clicking Staff button...');
  await staffButton.click();
  console.log('Staff button clicked');
  
  console.log('Step 4: Waiting for API call and navigation...');
  await page.waitForTimeout(3000);
  
  const afterClickUrl = page.url();
  console.log(`URL after click: ${afterClickUrl}`);
  
  console.log('Step 5: Checking for Staff Dashboard content...');
  const staffDashboard = await page.locator('h1:has-text("Staff Dashboard")').isVisible();
  console.log(`Staff Dashboard visible: ${staffDashboard}`);
  
  const bodyText = await page.textContent('body');
  console.log(`Body contains "Staff": ${bodyText?.includes('Staff')}`);
  console.log(`Body contains "Dashboard": ${bodyText?.includes('Dashboard')}`);
  
  // Check cookies
  const cookies = await page.context().cookies();
  const hasAccessToken = cookies.some(c => c.name === 'accessToken');
  console.log(`Has access token: ${hasAccessToken}`);
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Login page loads: true`);
  console.log(`✅ Staff button exists: ${buttonVisible}`);
  console.log(`❌ Navigation successful: ${afterClickUrl.includes('/staff')}`);
  console.log(`❌ Staff content loads: ${staffDashboard}`);
  console.log(`${hasAccessToken ? '✅' : '❌'} Authentication token: ${hasAccessToken}`);
});