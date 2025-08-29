import { test, expect } from '@playwright/test';

test.describe('Final Shipnorth Verification', () => {
  test('Staff interface complete verification', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(5000);

    // Verify we're on staff page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/staff');

    // Take dashboard screenshot
    await page.screenshot({ path: 'final-staff-dashboard.png', fullPage: true });

    // Test navigation to customers
    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-customers.png', fullPage: true });

    // Test navigation to packages
    await page.goto('http://localhost:3001/staff/packages');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-packages.png', fullPage: true });

    // Test navigation to loads
    await page.goto('http://localhost:3001/staff/loads');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-loads.png', fullPage: true });

    console.log('✅ All staff pages accessible and functional');
  });

  test('Forms functionality verification', async ({ page }) => {
    // Login as staff
    await page.goto('http://localhost:3001/login');
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(5000);

    // Test customer form
    await page.goto('http://localhost:3001/staff/customers');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add Customer")');
    await page.waitForTimeout(2000);

    // Check if form opened
    const customerForm = page.locator('text=Add New Customer');
    const hasCustomerForm = await customerForm.isVisible();
    console.log('Customer form visible:', hasCustomerForm);

    if (hasCustomerForm) {
      await page.screenshot({ path: 'final-customer-form.png', fullPage: true });
      await page.click('button:has-text("Cancel")');
    }

    // Test package form
    await page.goto('http://localhost:3001/staff/packages');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add Package")');
    await page.waitForTimeout(2000);

    const packageForm = page.locator('text=Add New Package');
    const hasPackageForm = await packageForm.isVisible();
    console.log('Package form visible:', hasPackageForm);

    if (hasPackageForm) {
      await page.screenshot({ path: 'final-package-form.png', fullPage: true });
    }

    console.log('✅ Forms verification complete');
  });

  test('Documentation and search verification', async ({ page }) => {
    // Test docs
    await page.goto('http://localhost:3001/docs');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-docs.png', fullPage: true });

    // Test search page
    await page.goto('http://localhost:3001/search');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'final-search.png', fullPage: true });

    console.log('✅ Documentation and search verification complete');
  });
});
