import { test, expect } from '@playwright/test';

test.describe('Driver Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock driver authentication
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { 
          user: { 
            id: 'driver-123', 
            role: 'driver', 
            email: 'driver@shipnorth.com',
            firstName: 'Mike',
            lastName: 'Driver'
          } 
        }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    // Mock loads data
    await page.route('**/loads', async (route) => {
      await route.fulfill({
        json: {
          loads: [
            {
              id: 'load-active',
              status: 'in_transit',
              driverId: 'driver-123',
              departureDate: '2024-01-20T08:00:00Z',
              totalPackages: 15,
              deliveryCities: [
                {
                  city: 'Toronto',
                  province: 'ON',
                  country: 'CA',
                  expectedDeliveryDate: '2024-01-21T17:00:00Z',
                  distance: 100,
                  drivingDuration: 120,
                },
                {
                  city: 'Montreal',
                  province: 'QC',
                  country: 'CA',
                  expectedDeliveryDate: '2024-01-22T17:00:00Z',
                  distance: 350,
                  drivingDuration: 300,
                },
              ],
            },
            {
              id: 'load-planned-1',
              status: 'planned',
              driverId: null,
              departureDate: '2024-01-22T09:00:00Z',
              totalPackages: 8,
              deliveryCities: [
                {
                  city: 'Ottawa',
                  province: 'ON',
                  country: 'CA',
                  distance: 200,
                  drivingDuration: 180,
                },
              ],
            },
          ]
        }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    // Mock load locations
    await page.route('**/loads/load-active/locations', async (route) => {
      await route.fulfill({
        json: {
          currentLocation: {
            lat: 43.6532,
            lng: -79.3832,
            address: 'Highway 401 E, ON',
            timestamp: '2024-01-20T14:30:00Z',
            isManual: false,
          },
          locations: []
        }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/driver');
    await page.waitForLoadState('networkidle');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display driver dashboard correctly', async ({ page }) => {
    await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible();
    await expect(page.locator('text=Mike Driver • GPS Enabled')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should show active load with GPS tracking', async ({ page }) => {
    await expect(page.locator('h2:has-text("Active Load:")')).toBeVisible();
    await expect(page.locator('text=2 destinations • 15 packages')).toBeVisible();
    await expect(page.locator('text=Last update:')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should enable manual location mode', async ({ page }) => {
    await page.click('button:has-text("Manual Location")');
    await expect(page.locator('text=Click to set location')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }