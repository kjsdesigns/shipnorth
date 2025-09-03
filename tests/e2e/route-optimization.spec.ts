import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.API_PORT || 8850}`;
const WEB_BASE = `http://localhost:${process.env.WEB_PORT || 8849}`;

test.describe('Route Optimization', () => {
  let authToken: string;
  let testLoadId: string;
  
  test.beforeAll(async ({ request }) => {
    // Login as staff user
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'staff@shipnorth.com',
        password: 'staff123'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    
    // Create test data for route optimization
    const testDataResponse = await request.post(`${API_BASE}/test/create-route-optimization-data`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (testDataResponse.ok()) {
      const testData = await testDataResponse.json();
      testLoadId = testData.load.id;
      console.log(`Created test load: ${testLoadId}`);
    } else {
      console.warn('Failed to create test data, tests may use existing data');
    }
  });

  test('should load route optimization page for a load', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${WEB_BASE}/login`);
    
    // Login as staff
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to staff dashboard
    await expect(page).toHaveURL(/\/staff/);
    
    // Navigate to loads or find a test load
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      // Find any available load
      await page.goto(`${WEB_BASE}/staff`);
      const loadLink = page.locator('a[href*="/staff/loads/"]').first();
      await expect(loadLink).toBeVisible({ timeout: 10000 });
      await loadLink.click();
    }
    
    // Verify route optimization interface is present
    await expect(page.locator('text=Route Optimizer')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=AI Optimize')).toBeVisible();
  });

  test('should perform initial route optimization', async ({ page }) => {
    // Login and navigate to load detail page
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // Click AI Optimize button
    await page.click('button:has-text("AI Optimize")');
    
    // Wait for optimization to complete
    await expect(page.locator('text=Optimizing...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Verify optimized route is displayed
    await expect(page.locator('text=Optimized Route')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Distance')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Stops')).toBeVisible();
    
    // Verify route stops are displayed
    await expect(page.locator('[data-testid="route-stop"]').first()).toBeVisible({ timeout: 5000 });
    
    // Verify driving times are shown between stops
    await expect(page.locator('text=/\\d+ min drive from previous stop/')).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing route and reordering cities', async ({ page }) => {
    // Setup and navigate to load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // First optimize route
    await page.click('button:has-text("AI Optimize")');
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Enter edit mode
    await page.click('button:has-text("Edit Route")');
    await expect(page.locator('text=View Mode')).toBeVisible();
    
    // Verify edit controls are visible
    await expect(page.locator('button[aria-label="Move up"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Move down"]')).toBeVisible();
    await expect(page.locator('button:has-text("Manage Packages")')).toBeVisible();
    await expect(page.locator('button:has-text("Re-optimize")')).toBeVisible();
    
    // Test reordering cities by moving the second city up
    const secondStopMoveUpBtn = page.locator('[data-testid="route-stop"]').nth(1).locator('button[aria-label="Move up"]');
    if (await secondStopMoveUpBtn.isVisible()) {
      await secondStopMoveUpBtn.click();
      
      // Wait for re-optimization
      await expect(page.locator('text=Optimizing...')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
      
      // Verify route was updated with new order
      await expect(page.locator('text=Route Optimizer')).toBeVisible();
    }
  });

  test('should allow managing packages in route', async ({ page }) => {
    // Setup and navigate to load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // Optimize route first
    await page.click('button:has-text("AI Optimize")');
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Enter edit mode
    await page.click('button:has-text("Edit Route")');
    
    // Open package manager
    await page.click('button:has-text("Manage Packages")');
    
    // Verify package manager modal opens
    await expect(page.locator('text=Manage Route Packages')).toBeVisible();
    await expect(page.locator('text=Available Packages')).toBeVisible();
    await expect(page.locator('text=Route Packages')).toBeVisible();
    
    // Test removing a package from route
    const removeButton = page.locator('button:has([data-icon="trash-2"])').first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Verify re-optimization happens
      await expect(page.locator('text=Optimizing...')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    }
    
    // Close package manager
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Manage Route Packages')).not.toBeVisible();
  });

  test('should show driving times between cities', async ({ page }) => {
    // Setup and navigate to load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // Optimize route
    await page.click('button:has-text("AI Optimize")');
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Verify driving times are displayed
    const drivingTimePattern = /\d+ min drive from previous stop/;
    await expect(page.locator(`text=${drivingTimePattern}`)).toBeVisible({ timeout: 10000 });
    
    // Count how many driving time indicators are shown (should be stops - 1)
    const stopCount = await page.locator('[data-testid="route-stop"]').count();
    const drivingTimeCount = await page.locator(`text=${drivingTimePattern}`).count();
    
    // There should be one fewer driving time indicator than stops (first stop has no previous)
    expect(drivingTimeCount).toBe(Math.max(0, stopCount - 1));
  });

  test('should save and activate optimized routes', async ({ page }) => {
    // Setup and navigate to load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // Optimize route
    await page.click('button:has-text("AI Optimize")');
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Save the route
    await page.click('button:has-text("Save Route")');
    await expect(page.locator('text=Saving...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Saving...')).not.toBeVisible({ timeout: 15000 });
    
    // Verify route was saved successfully
    await expect(page.locator('text=Route Optimizer')).toBeVisible();
  });

  test('should display route performance metrics', async ({ page }) => {
    // Setup and navigate to load
    await page.goto(`${WEB_BASE}/login`);
    await page.fill('input[type="email"]', 'staff@shipnorth.com');
    await page.fill('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/staff/);
    
    if (testLoadId) {
      await page.goto(`${WEB_BASE}/staff/loads/${testLoadId}`);
    } else {
      await page.goto(`${WEB_BASE}/staff`);
      await page.locator('a[href*="/staff/loads/"]').first().click();
    }
    
    // Optimize route
    await page.click('button:has-text("AI Optimize")');
    await expect(page.locator('text=Optimizing...')).not.toBeVisible({ timeout: 30000 });
    
    // Verify performance metrics are displayed
    await expect(page.locator('text=Distance')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=Stops')).toBeVisible();
    await expect(page.locator('text=/\\d+% Optimized/')).toBeVisible();
    
    // Verify specific metrics have numeric values
    await expect(page.locator('text=/\\d+\\.\\d+ km/')).toBeVisible(); // Distance
    await expect(page.locator('text=/\\d+h \\d+m/')).toBeVisible(); // Duration
    await expect(page.locator('text=/\\d+ stops/')).toBeVisible(); // Stop count
  });
});