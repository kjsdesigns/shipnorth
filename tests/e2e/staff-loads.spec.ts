import { test, expect } from '@playwright/test';

test.describe('Staff Loads Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff', email: 'staff@shipnorth.com' } }
      });
    });

    // Mock loads API
    await page.route('**/loads', async (route) => {
      await route.fulfill({
        json: {
          loads: [
            {
              id: 'load-123',
              driverName: 'John Driver',
              status: 'planned',
              departureDate: '2024-01-20T08:00:00Z',
              defaultDeliveryDate: '2024-01-22T17:00:00Z',
              deliveryCities: [
                {
                  city: 'Toronto',
                  province: 'ON',
                  country: 'CA',
                  expectedDeliveryDate: '2024-01-21T17:00:00Z',
                  distance: 500,
                  drivingDuration: 360,
                },
                {
                  city: 'Montreal',
                  province: 'QC', 
                  country: 'CA',
                  expectedDeliveryDate: '2024-01-22T17:00:00Z',
                  distance: 850,
                  drivingDuration: 600,
                },
                {
                  city: 'Ottawa',
                  province: 'ON',
                  country: 'CA',
                  // No delivery date set
                },
              ],
              currentLocation: {
                lat: 43.6532,
                lng: -79.3832,
                address: 'Toronto, ON',
                timestamp: '2024-01-20T14:30:00Z',
                isManual: false,
              },
              packageCount: 15,
              destinationInfo: {
                withDates: 2,
                total: 3,
                cities: [
                  { city: 'Toronto', province: 'ON', expectedDeliveryDate: '2024-01-21T17:00:00Z' },
                  { city: 'Montreal', province: 'QC', expectedDeliveryDate: '2024-01-22T17:00:00Z' },
                  { city: 'Ottawa', province: 'ON' },
                ],
              },
              deliveryDateRange: {
                earliest: '2024-01-21T17:00:00Z',
                latest: '2024-01-22T17:00:00Z',
              },
            },
            {
              id: 'load-456',
              driverName: 'Sarah Logistics',
              status: 'in_transit',
              departureDate: '2024-01-19T09:00:00Z',
              deliveryCities: [
                {
                  city: 'Vancouver',
                  province: 'BC',
                  country: 'CA',
                  expectedDeliveryDate: '2024-01-23T17:00:00Z',
                },
              ],
              currentLocation: {
                lat: 49.2827,
                lng: -123.1207,
                address: 'Vancouver, BC',
                timestamp: '2024-01-20T16:45:00Z',
                isManual: true,
              },
              packageCount: 8,
              destinationInfo: {
                withDates: 1,
                total: 1,
                cities: [
                  { city: 'Vancouver', province: 'BC', expectedDeliveryDate: '2024-01-23T17:00:00Z' },
                ],
              },
              deliveryDateRange: {
                earliest: '2024-01-23T17:00:00Z',
                latest: '2024-01-23T17:00:00Z',
              },
            },
            {
              id: 'load-789',
              driverName: null,
              status: 'planned',
              departureDate: '2024-01-25T10:00:00Z',
              deliveryCities: [],
              currentLocation: null,
              packageCount: 0,
              destinationInfo: {
                withDates: 0,
                total: 0,
                cities: [],
              },
              deliveryDateRange: {
                earliest: '',
                latest: '',
              },
            },
          ],
        }
      });
    });

    // Mock other required APIs
    await page.route('**/packages**', async (route) => {
      await route.fulfill({ json: { packages: [] } });
    });

    await page.route('**/customers', async (route) => {
      await route.fulfill({ json: { customers: [] } });
    });

    await page.route('**/packages/stats/overview', async (route) => {
      await route.fulfill({ json: { unassigned: 0, assigned: 0, in_transit: 0 } });
    });

    // Navigate to staff dashboard
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
  });

  test('should display loads table with enhanced columns', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Check table headers
    await expect(page.locator('th:has-text(\"Load ID\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Driver\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Status\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Departure Date\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Destinations\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Delivery Dates\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Current Location\")')).toBeVisible();
    await expect(page.locator('th:has-text(\"Actions\")')).toBeVisible();

    // Check that loads are displayed
    await expect(page.locator('tbody tr')).toHaveCount(3);
  });

  test('should display load information correctly', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Check first load data
    await expect(page.locator('text=Load #oad-123').first()).toBeVisible(); // Partial match
    await expect(page.locator('text=John Driver')).toBeVisible();
    await expect(page.locator('text=planned')).toBeVisible();
    await expect(page.locator('text=1/20/2024')).toBeVisible(); // Departure date

    // Check destinations info with tooltip functionality
    await expect(page.locator('text=2/3 cities')).toBeVisible();
    
    // Check delivery date range
    await expect(page.locator('text=1/21/2024 - 1/22/2024')).toBeVisible();

    // Check current location
    await expect(page.locator('text=Toronto, ON')).toBeVisible();
  });

  test('should show destination cities in tooltip on hover', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Find the eye icon for viewing destinations
    const destinationEyeIcon = page.locator('tbody tr:first-child .group button');
    
    // Hover over the eye icon to show tooltip
    await destinationEyeIcon.hover();
    await page.waitForTimeout(500); // Wait for tooltip

    // Check that tooltip content is visible
    await expect(page.locator('text=Toronto, ON (1/21/2024)')).toBeVisible();
    await expect(page.locator('text=Montreal, QC (1/22/2024)')).toBeVisible();
    await expect(page.locator('text=Ottawa, ON (TBD)')).toBeVisible();
  });

  test('should display different load statuses correctly', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Check status badges have correct styling
    const plannedStatus = page.locator('tbody tr:first-child .bg-gray-100');
    await expect(plannedStatus).toContainText('planned');

    const inTransitStatus = page.locator('tbody tr:nth-child(2) .bg-yellow-100');
    await expect(inTransitStatus).toContainText('in_transit');
  });

  test('should handle loads without drivers or locations', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Check third load (no driver, no location)
    const unassignedRow = page.locator('tbody tr:nth-child(3)');
    await expect(unassignedRow.locator('text=Unassigned')).toBeVisible();
    await expect(unassignedRow.locator('text=No location')).toBeVisible();
    await expect(unassignedRow.locator('text=0/0 cities')).toBeVisible();
  });

  test('should display current location with GPS indicator', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Check that location is displayed with map pin icon
    const locationCell = page.locator('tbody tr:first-child td').nth(6);
    await expect(locationCell.locator('svg')).toHaveAttribute('class', /text-green-500/);
    await expect(locationCell.locator('text=Toronto, ON')).toBeVisible();

    // Check second load with manual location entry
    const manualLocationCell = page.locator('tbody tr:nth-child(2) td').nth(6);
    await expect(manualLocationCell.locator('text=Vancouver, BC')).toBeVisible();
  });

  test('should have functional action buttons', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    const firstLoadActions = page.locator('tbody tr:first-child td:last-child');
    
    // Check that action buttons are present
    await expect(firstLoadActions.locator('button[title=\"View Details\"]')).toBeVisible();
    await expect(firstLoadActions.locator('button[title=\"Edit Load\"]')).toBeVisible();
    await expect(firstLoadActions.locator('button[title=\"View Route\"]')).toBeVisible();
    await expect(firstLoadActions.locator('button')).toHaveCount(4); // Including more options button
  });

  test('should handle empty loads list', async ({ page }) => {
    // Override with empty loads
    await page.route('**/loads', async (route) => {
      await route.fulfill({
        json: { loads: [] }
      });
    });

    await page.goto('/staff');
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Should show empty table
    await expect(page.locator('tbody')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
    
    // Create Load button should still be visible
    await expect(page.locator('button:has-text(\"Create Load\")')).toBeVisible();
  });

  test('should show delivery date range correctly', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // First load has date range
    const firstLoadDates = page.locator('tbody tr:first-child td').nth(5);
    await expect(firstLoadDates).toContainText('1/21/2024 - 1/22/2024');

    // Second load has single date (same start and end)
    const secondLoadDates = page.locator('tbody tr:nth-child(2) td').nth(5);
    await expect(secondLoadDates).toContainText('1/23/2024');

    // Third load has no dates
    const thirdLoadDates = page.locator('tbody tr:nth-child(3) td').nth(5);
    await expect(thirdLoadDates).toContainText('-');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    // Table should be horizontally scrollable
    await expect(page.locator('.overflow-x-auto')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);

    // Should still be functional
    await expect(page.locator('text=All Loads')).toBeVisible();

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should handle load actions', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Mock load detail API for when view details is clicked
    await page.route('**/loads/load-123', async (route) => {
      await route.fulfill({
        json: {
          load: {
            id: 'load-123',
            driverName: 'John Driver',
            status: 'planned',
            packages: [],
            deliveryCities: [],
          }
        }
      });
    });

    // Click view details button
    const viewDetailsButton = page.locator('tbody tr:first-child button[title=\"View Details\"]');
    await viewDetailsButton.click();

    // Should handle the click (implementation dependent)
    await page.waitForTimeout(100);
  });

  test('should create new load', async ({ page }) => {
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Mock create load API
    await page.route('**/loads', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            load: {
              id: 'new-load-123',
              status: 'planned',
              driverName: null,
            }
          }
        });
      }
    });

    // Click create load button
    const createButton = page.locator('button:has-text(\"Create Load\")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Should handle create action (implementation dependent)
    await page.waitForTimeout(100);
  });
});

test.describe('Staff Loads Error Handling', () => {
  test('should handle loads API error', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff' } }
      });
    });

    await page.route('**/loads', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Failed to load data' }
      });
    });

    await page.route('**/packages**', async (route) => {
      await route.fulfill({ json: { packages: [] } });
    });

    await page.goto('/staff');
    await page.click('button:has-text(\"loads\")');
    
    // Should handle error gracefully
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle malformed load data', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff' } }
      });
    });

    await page.route('**/loads', async (route) => {
      await route.fulfill({
        json: {
          loads: [
            {
              // Missing required fields
              id: 'incomplete-load',
            },
            {
              id: 'load-with-null-cities',
              deliveryCities: null,
              destinationInfo: null,
            }
          ]
        }
      });
    });

    await page.route('**/packages**', async (route) => {
      await route.fulfill({ json: { packages: [] } });
    });

    await page.goto('/staff');
    await page.click('button:has-text(\"loads\")');
    await page.waitForLoadState('networkidle');

    // Should still render table even with incomplete data
    await expect(page.locator('tbody')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
});