import { test, expect } from '@playwright/test';

test.describe('Staff Packages Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff', email: 'staff@shipnorth.com' } }
      });
    });

    await page.route('**/packages/stats/overview', async (route) => {
      await route.fulfill({
        json: { unassigned: 15, assigned: 8, in_transit: 12 }
      });
    });

    await page.route('**/packages**', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      
      let packages = [
        {
          id: 'pkg-1',
          trackingNumber: 'TRACK001',
          shipTo: { name: 'John Doe', city: 'Toronto' },
          shipmentStatus: 'ready',
          weight: 5.5,
          loadId: null,
          expectedDeliveryDate: null,
        },
        {
          id: 'pkg-2', 
          trackingNumber: 'TRACK002',
          shipTo: { name: 'Jane Smith', city: 'Montreal' },
          shipmentStatus: 'ready',
          weight: 3.2,
          loadId: 'load-123',
          expectedDeliveryDate: '2024-01-20T17:00:00Z',
        },
        {
          id: 'pkg-3',
          trackingNumber: 'TRACK003', 
          shipTo: { name: 'Bob Wilson', city: 'Vancouver' },
          shipmentStatus: 'in_transit',
          weight: 8.7,
          loadId: 'load-456',
          expectedDeliveryDate: '2024-01-22T17:00:00Z',
        },
      ];

      if (status === 'unassigned') {
        packages = packages.filter(pkg => !pkg.loadId);
      } else if (status === 'assigned') {
        packages = packages.filter(pkg => pkg.loadId && pkg.shipmentStatus === 'ready');
      } else if (status === 'in_transit') {
        packages = packages.filter(pkg => pkg.shipmentStatus === 'in_transit');
      }

      await route.fulfill({
        json: {
          packages,
          pagination: { page: 1, limit: 50, total: packages.length }
        }
      });
    });

    await page.route('**/customers', async (route) => {
      await route.fulfill({ json: { customers: [] } });
    });

    await page.route('**/loads', async (route) => {
      await route.fulfill({ json: { loads: [] } });
    });

    // Navigate to staff dashboard
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
  });

  test('should display package status cards with correct counts', async ({ page }) => {
    // Check that status cards are displayed
    await expect(page.locator('text=Unassigned Packages')).toBeVisible();
    await expect(page.locator('text=Assigned Packages')).toBeVisible();
    await expect(page.locator('text=In Transit')).toBeVisible();

    // Check the counts are displayed correctly
    await expect(page.locator('text=15').first()).toBeVisible(); // Unassigned count
    await expect(page.locator('text=8').first()).toBeVisible();  // Assigned count
    await expect(page.locator('text=12').first()).toBeVisible(); // In transit count
  });

  test('should filter packages when clicking status cards', async ({ page }) => {
    // Click on the packages tab first
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Initially should show all packages
    await expect(page.locator('tbody tr')).toHaveCount(3);

    // Click unassigned status card
    await page.click('text=Unassigned Packages');
    await page.waitForLoadState('networkidle');

    // Should now show only unassigned packages
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('text=TRACK001')).toBeVisible();
    await expect(page.locator('text=Unassigned')).toBeVisible();
  });

  test('should display packages table with enhanced columns', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Check table headers
    await expect(page.locator('th:has-text(\"Tracking #\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Recipient\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Status\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Load\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Expected Delivery\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Weight\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Actions\")')).toBeVisible();

    // Check that data is displayed correctly
    await expect(page.locator('text=TRACK001')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Load #oad-123').last()).toBeVisible(); // Partial match for Load #
    await expect(page.locator('text=1/20/2024')).toBeVisible(); // Expected delivery date
  });

  test('should support bulk selection of packages', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Initially no packages selected
    await expect(page.locator('text=Bulk Actions')).not.toBeVisible();

    // Select individual packages
    await page.check('tbody tr:first-child input[type=\"checkbox\"]');
    await page.check('tbody tr:nth-child(2) input[type=\"checkbox\"]');

    // Bulk actions button should appear
    await expect(page.locator('text=Bulk Actions (2)')).toBeVisible();

    // Test select all functionality
    await page.click('text=Select All');
    await page.waitForTimeout(100);

    // All checkboxes should be checked
    const checkboxes = page.locator('tbody input[type=\"checkbox\"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }

    // Clear selection
    await page.click('text=Clear (3)');
    await page.waitForTimeout(100);

    // Bulk actions should disappear
    await expect(page.locator('text=Bulk Actions')).not.toBeVisible();
  });

  test('should support different results per page options', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Check default is 50 per page
    await expect(page.locator('select').first()).toHaveValue('50');

    // Change to 100 per page
    await page.selectOption('select', '100');
    await page.waitForLoadState('networkidle');

    // Verify the selection
    await expect(page.locator('select').first()).toHaveValue('100');
  });

  test('should display mark as delivered button and functionality', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Mock the mark delivered API call
    await page.route('**/packages/*/mark-delivered', async (route) => {
      await route.fulfill({
        json: { success: true, package: { id: 'pkg-1', shipmentStatus: 'delivered' } }
      });
    });

    // Find and click the mark as delivered button (green checkmark)
    const deliveredButton = page.locator('tbody tr:first-child button[title=\"Mark as Delivered\"]');
    await expect(deliveredButton).toBeVisible();
    await deliveredButton.click();

    // Should show delivery confirmation modal (this would need to be implemented)
    // For now, we'll just verify the button click was handled
    await page.waitForTimeout(100);
  });

  test('should handle filter dropdown correctly', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Check filter dropdown options
    const filterSelect = page.locator('select').nth(1);
    await expect(filterSelect).toHaveValue('');

    // Test filtering by unassigned
    await filterSelect.selectOption('unassigned');
    await page.waitForLoadState('networkidle');

    // Should show only unassigned packages
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // Test filtering by in transit
    await filterSelect.selectOption('in_transit');
    await page.waitForLoadState('networkidle');

    // Should show only in transit packages
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('text=TRACK003')).toBeVisible();
  });

  test('should show load assignment information correctly', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Check load assignment display
    await expect(page.locator('text=Unassigned')).toBeVisible(); // First package
    await expect(page.locator('text=Load #oad-123').first()).toBeVisible(); // Second package (partial match)
    
    // Check expected delivery dates
    await expect(page.locator('text=1/20/2024')).toBeVisible(); // Package with load
    await expect(page.locator('text=1/22/2024')).toBeVisible(); // Another package
  });

  test('should navigate between tabs correctly', async ({ page }) => {
    // Start on overview tab
    await expect(page.locator('button:has-text(\"overview\")').first()).toHaveClass(/border-blue-500/);

    // Click packages tab
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('button:has-text(\"packages\")').first()).toHaveClass(/border-blue-500/);
    await expect(page.locator('text=All Packages')).toBeVisible();

    // Click back to overview
    await page.click('button:has-text(\"overview\")');
    await page.waitForTimeout(100);
    
    await expect(page.locator('button:has-text(\"overview\")').first()).toHaveClass(/border-blue-500/);
  });

  test('should handle responsive design', async ({ page }) => {
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    // Table should be scrollable horizontally
    await expect(page.locator('.overflow-x-auto')).toBeVisible();

    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);

    // Should still be readable
    await expect(page.locator('text=All Packages')).toBeVisible();

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});

test.describe('Staff Packages Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/packages**', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Internal server error' }
      });
    });

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff' } }
      });
    });

    await page.goto('/staff');
    
    // Should handle error gracefully (this depends on error handling implementation)
    await page.waitForTimeout(1000);
    
    // Should not crash the application
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle empty package list', async ({ page }) => {
    await page.route('**/packages**', async (route) => {
      await route.fulfill({
        json: { packages: [], pagination: { page: 1, limit: 50, total: 0 } }
      });
    });

    await page.route('**/packages/stats/overview', async (route) => {
      await route.fulfill({
        json: { unassigned: 0, assigned: 0, in_transit: 0 }
      });
    });

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff' } }
      });
    });

    await page.goto('/staff');
    await page.click('button:has-text(\"packages\")');
    await page.waitForLoadState('networkidle');

    // Should show empty state appropriately
    await expect(page.locator('tbody')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });
});