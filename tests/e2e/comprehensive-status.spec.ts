import { test } from '@playwright/test';

test('Comprehensive functionality status check', async ({ page }) => {
  console.log('🔍 COMPREHENSIVE STATUS CHECK - Stable Stack');
  console.log('='.repeat(50));
  
  let status = {
    api: false,
    homepage: false,
    loginPage: false,
    staffLogin: false,
    staffPortal: false,
    customerPortal: false,
    driverPortal: false
  };
  
  // Test 1: API Health
  console.log('1. Testing API health...');
  try {
    const apiUrl = `http://localhost:${process.env.API_PORT || 8850}`;
    const response = await page.request.get(`${apiUrl}/health`);
    status.api = response.ok();
    console.log(`   API Health: ${status.api ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e) {
    console.log('   API Health: ❌ ERROR -', e.message);
  }
  
  // Test 2: Homepage
  console.log('2. Testing homepage...');
  try {
    const webUrl = `http://localhost:${process.env.WEB_PORT || 8849}`;
    await page.goto(webUrl);
    await page.waitForTimeout(2000);
    const title = await page.title();
    const hasContent = title.includes('Shipnorth');
    status.homepage = hasContent;
    console.log(`   Homepage: ${status.homepage ? '✅ PASS' : '❌ FAIL'} - "${title}"`);
  } catch (e) {
    console.log('   Homepage: ❌ ERROR -', e.message);
  }
  
  // Test 3: Login page  
  console.log('3. Testing login page...');
  try {
    await page.goto(`${webUrl}/login`);
    await page.waitForTimeout(2000);
    const welcomeVisible = await page.locator('h2:has-text("Welcome back")').isVisible();
    const staffButton = await page.locator('button:has-text("Staff")').first().isVisible();
    status.loginPage = welcomeVisible && staffButton;
    console.log(`   Login Page: ${status.loginPage ? '✅ PASS' : '❌ FAIL'} - Welcome: ${welcomeVisible}, Staff btn: ${staffButton}`);
  } catch (e) {
    console.log('   Login Page: ❌ ERROR -', e.message);
  }
  
  // Test 4: Staff Login Flow
  console.log('4. Testing staff login flow...');
  try {
    await page.goto(`${webUrl}/login`);
    await page.waitForTimeout(1000);
    
    const staffButton = page.getByRole('button', { name: 'Staff', exact: true });
    if (await staffButton.isVisible()) {
      await staffButton.click();
      await page.waitForTimeout(3000); // Wait for login API call
      
      const currentUrl = page.url();
      status.staffLogin = currentUrl.includes('/staff');
      console.log(`   Staff Login: ${status.staffLogin ? '✅ PASS' : '❌ FAIL'} - URL: ${currentUrl}`);
    } else {
      console.log('   Staff Login: ❌ FAIL - Button not found');
    }
  } catch (e) {
    console.log('   Staff Login: ❌ ERROR -', e.message);
  }
  
  // Test 5: Staff Portal Content
  console.log('5. Testing staff portal content...');
  try {
    await page.goto(`${webUrl}/staff`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasStaffContent = await page.locator('h1:has-text("Staff Dashboard")').isVisible();
    status.staffPortal = hasStaffContent;
    console.log(`   Staff Portal: ${status.staffPortal ? '✅ PASS' : '❌ FAIL'} - URL: ${currentUrl}, Content: ${hasStaffContent}`);
  } catch (e) {
    console.log('   Staff Portal: ❌ ERROR -', e.message);
  }
  
  // Test 6: Customer Portal
  console.log('6. Testing customer portal...');
  try {
    await page.goto(`${webUrl}/portal`);
    await page.waitForTimeout(2000);
    const hasPortalContent = await page.locator('h1:has-text("Customer Portal")').isVisible();
    status.customerPortal = hasPortalContent;
    console.log(`   Customer Portal: ${status.customerPortal ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e) {
    console.log('   Customer Portal: ❌ ERROR -', e.message);
  }
  
  // Test 7: Driver Portal  
  console.log('7. Testing driver portal...');
  try {
    await page.goto(`${webUrl}/driver`);
    await page.waitForTimeout(2000);
    const hasDriverContent = await page.locator('h1:has-text("Driver Dashboard")').isVisible();
    status.driverPortal = hasDriverContent;
    console.log(`   Driver Portal: ${status.driverPortal ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e) {
    console.log('   Driver Portal: ❌ ERROR -', e.message);
  }
  
  // Summary
  console.log('\n📊 FINAL STATUS SUMMARY:');
  console.log('='.repeat(30));
  const total = Object.values(status).filter(Boolean).length;
  const outOf = Object.keys(status).length;
  console.log(`Overall: ${total}/${outOf} components working (${Math.round(total/outOf*100)}%)`);
  
  Object.entries(status).forEach(([key, working]) => {
    console.log(`${working ? '✅' : '❌'} ${key}: ${working ? 'WORKING' : 'NEEDS FIX'}`);
  });
});