import { test } from '@playwright/test';

test('Debug runtime errors', async ({ page }) => {
  console.log('🔍 Checking for JavaScript runtime errors...');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ JS Error:', msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
      console.log('⚠️ JS Warning:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
    errors.push(`Page Error: ${error.message}`);
  });
  
  // Test homepage
  console.log('Testing homepage...');
  await page.goto('http://localhost:8849');
  await page.waitForTimeout(5000); // Wait for React to mount
  
  const rootHtml = await page.locator('#root').innerHTML();
  console.log('Root content length:', rootHtml.length);
  console.log('Root content preview:', rootHtml.slice(0, 200));
  
  // Test login page  
  console.log('Testing login page...');
  await page.goto('http://localhost:8849/login');
  await page.waitForTimeout(3000);
  
  const loginRootHtml = await page.locator('#root').innerHTML();
  console.log('Login root content length:', loginRootHtml.length);
  
  console.log(`Total errors: ${errors.length}, warnings: ${warnings.length}`);
  console.log('Errors:', errors);
  console.log('Warnings:', warnings.slice(0, 3)); // First 3 warnings
});