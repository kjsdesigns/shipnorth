import { test, expect } from '@playwright/test';

test('Debug staff page loading', async ({ page }) => {
  console.log('🔍 Testing staff page direct navigation...');
  
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ JS Error:', msg.text());
    }
  });
  
  // Test direct navigation to staff
  console.log('Navigating to /staff...');
  await page.goto('http://localhost:8849/staff');
  await page.waitForTimeout(3000);
  
  // Check what's rendered
  const rootHtml = await page.locator('#root').innerHTML();
  console.log('Root content length:', rootHtml.length);
  console.log('Root preview:', rootHtml.slice(0, 300));
  
  // Check for staff dashboard text
  const staffText = await page.textContent('body');
  const hasStaffDashboard = staffText?.includes('Staff Dashboard');
  console.log('Has "Staff Dashboard" text:', hasStaffDashboard);
  
  // Check for specific elements
  const h1 = await page.locator('h1').textContent();
  console.log('H1 content:', h1);
  
  console.log('Errors found:', errors.length);
  errors.forEach(error => console.log(' -', error));
});