import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { CustomerPortal } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { testData } from './utils/test-data';

/**
 * Comprehensive Customer Portal Tests
 * Consolidates: comprehensive-customer, customer-portal, customer-registration, customer-tracking
 */

test.describe('Customer Portal', () => {
  let authHelpers: AuthHelpers;
  let customerPortal: CustomerPortal;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    customerPortal = new CustomerPortal(page);
    assertions = new CustomAssertions(page);
    
    // Login as customer before each test
    await authHelpers.quickLogin('customer'); 
            role: 'customer', 
            email: 'customer@example.com',
            customerId: 'cust-123'
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

    // Mock customer data
    await page.route('**/customers/cust-123', async (route) => {
      await route.fulfill({
        json: {
          customer: {
            id: 'cust-123',
            firstName: 'John',
            lastName: 'Customer',
            email: 'customer@example.com',
            phone: '+1 (555) 123-4567',
            addressLine1: '123 Customer St',
            addressLine2: 'Apt 2B',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5V 1A1',
            country: 'CA',
            stripePaymentMethodId: 'pm_test123',
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

    // Mock customer packages
    await page.route('**/customers/cust-123/packages', async (route) => {
      await route.fulfill({
        json: {
          packages: [
            {
              id: 'pkg-1',
              trackingNumber: 'TRACK001',
              shipmentStatus: 'in_transit',
              weight: 5.5,
              length: 30,
              width: 20,
              height: 15,
              carrier: 'Canada Post',
              quotedService: 'Expedited',
              loadId: 'load-active',
              expectedDeliveryDate: '2024-01-22T17:00:00Z',
              shipTo: {
                name: 'John Customer',
                address1: '123 Customer St',
                address2: 'Apt 2B',
                city: 'Toronto',
                province: 'ON',
                postalCode: 'M5V 1A1',
                country: 'CA',
              },
              loadLocation: {
                lat: 43.6532,
                lng: -79.3832,
                address: 'Highway 401, ON',
                timestamp: '2024-01-20T14:30:00Z',
                isManual: false,
              },
              locationHistory: [
                {
                  lat: 43.6532,
                  lng: -79.3832,
                  address: 'Toronto Depot',
                  timestamp: '2024-01-20T09:00:00Z',
                  isManual: false,
                },
                {
                  lat: 43.7000,
                  lng: -79.4000,
                  address: 'Highway 401, ON',
                  timestamp: '2024-01-20T14:30:00Z',
                  isManual: false,
                },
              ],
            },
            {
              id: 'pkg-2',
              trackingNumber: 'TRACK002',
              shipmentStatus: 'delivered',
              weight: 2.1,
              deliveryDate: '2024-01-15T16:45:00Z',
              shipTo: {
                name: 'John Customer',
                city: 'Toronto',
                province: 'ON',
              },
              deliveryConfirmation: {
                deliveredAt: '2024-01-15T16:45:00Z',
                recipientName: 'John Customer',
                relationship: 'Resident',
                photoUrl: 'https://example.com/delivery-proof.jpg',
              },
            },
            {
              id: 'pkg-3',
              trackingNumber: 'TRACK003',
              shipmentStatus: 'ready',
              weight: 8.7,
              shipTo: {
                name: 'John Customer',
                city: 'Toronto',
                province: 'ON',
              },
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

    // Mock load locations for tracking
    await page.route('**/loads/load-active/locations', async (route) => {
      await route.fulfill({
        json: {
          currentLocation: {
            lat: 43.6532,
            lng: -79.3832,
            address: 'Highway 401, ON',
            timestamp: '2024-01-20T14:30:00Z',
            isManual: false,
          },
          locations: [
            {
              lat: 43.6532,
              lng: -79.3832,
              address: 'Toronto Depot',
              timestamp: '2024-01-20T09:00:00Z',
              isManual: false,
            },
            {
              lat: 43.7000,
              lng: -79.4000,
              address: 'Highway 401, ON',
              timestamp: '2024-01-20T14:30:00Z',
              isManual: false,
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

    await page.goto('/customer');
    await page.waitForLoadState('networkidle');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display customer dashboard correctly', async ({ page }) => {
    // Check welcome message
    await expect(page.locator('h1:has-text("Welcome back, John!")')).toBeVisible();
    
    // Check summary cards
    await expect(page.locator('text=3').first()).toBeVisible(); // Total packages
    await expect(page.locator('text=1').first()).toBeVisible(); // In transit
    await expect(page.locator('text=1').first()).toBeVisible(); // Delivered

    // Check card labels
    await expect(page.locator('text=Total Packages')).toBeVisible();
    await expect(page.locator('text=In Transit')).toBeVisible();
    await expect(page.locator('text=Delivered')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should show active shipments with live tracking', async ({ page }) => {
    // Check active shipments section
    await expect(page.locator('h2:has-text("Active Shipments")')).toBeVisible();
    
    // Check shipment details
    await expect(page.locator('text=TRACK001')).toBeVisible();
    await expect(page.locator('text=To: Toronto, ON')).toBeVisible();
    await expect(page.locator('text=In Transit')).toBeVisible();

    // Check current location display
    await expect(page.locator('h4:has-text("Current Location")')).toBeVisible();
    await expect(page.locator('text=Highway 401, ON')).toBeVisible();
    
    // Check expected delivery date
    await expect(page.locator('text=Expected delivery: 1/22/2024')).toBeVisible();
    
    // Check tracking details button
    await expect(page.locator('text=View Full Tracking Details')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display all packages table correctly', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("Tracking #")')).toBeVisible();
    await expect(page.locator('th:has-text("Destination")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Expected Delivery")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();

    // Check package data
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('text=TRACK001')).toBeVisible();
    await expect(page.locator('text=TRACK002')).toBeVisible();
    await expect(page.locator('text=TRACK003')).toBeVisible();

    // Check status badges
    await expect(page.locator('.bg-blue-100:has-text("In Transit")')).toBeVisible();
    await expect(page.locator('.bg-green-100:has-text("Delivered")')).toBeVisible();
    await expect(page.locator('.bg-gray-100:has-text("Ready for Pickup")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should open package details modal', async ({ page }) => {
    // Click view details button
    await page.click('button:has-text("View Full Tracking Details")');

    // Should open modal
    await expect(page.locator('h3:has-text("Package Details - TRACK001")')).toBeVisible();
    
    // Check package information
    await expect(page.locator('text=5.5 kg')).toBeVisible();
    await expect(page.locator('text=30×20×15 cm')).toBeVisible();
    await expect(page.locator('text=Canada Post')).toBeVisible();
    await expect(page.locator('text=Expedited')).toBeVisible();

    // Check delivery address
    await expect(page.locator('h4:has-text("Delivery Address")')).toBeVisible();
    await expect(page.locator('text=John Customer')).toBeVisible();
    await expect(page.locator('text=123 Customer St')).toBeVisible();

    // Check live tracking section
    await expect(page.locator('h4:has-text("Live Tracking")')).toBeVisible();
    await expect(page.locator('text=Last updated:')).toBeVisible();

    // Check tracking history
    await expect(page.locator('h4:has-text("Tracking History")')).toBeVisible();
    await expect(page.locator('text=Toronto Depot')).toBeVisible();
    await expect(page.locator('text=Highway 401, ON')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should close package details modal', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("View Full Tracking Details")');
    await expect(page.locator('h3:has-text("Package Details - TRACK001")')).toBeVisible();

    // Close modal
    await page.click('button:has-text("✕")');
    
    // Modal should be closed
    await expect(page.locator('h3:has-text("Package Details - TRACK001")')).not.toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should show delivery confirmation for delivered packages', async ({ page }) => {
    // Click on delivered package details
    const deliveredPackageRow = page.locator('tbody tr:has-text("TRACK002")');
    await deliveredPackageRow.locator('button').click();

    // Should show delivery confirmation section
    await expect(page.locator('h4:has-text("Delivery Confirmation")')).toBeVisible();
    await expect(page.locator('text=Delivered on 1/15/2024')).toBeVisible();
    await expect(page.locator('text=Received by: John Customer')).toBeVisible();
    await expect(page.locator('text=(Resident)')).toBeVisible();
    
    // Should show delivery photo
    await expect(page.locator('img[alt="Delivery proof"]')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display account information correctly', async ({ page }) => {
    // Check account information section
    await expect(page.locator('h2:has-text("Account Information")')).toBeVisible();
    
    // Check contact information
    await expect(page.locator('h3:has-text("Contact Information")')).toBeVisible();
    await expect(page.locator('text=customer@example.com')).toBeVisible();
    await expect(page.locator('text=+1 (555) 123-4567')).toBeVisible();

    // Check shipping address
    await expect(page.locator('h3:has-text("Shipping Address")')).toBeVisible();
    await expect(page.locator('text=123 Customer St')).toBeVisible();
    await expect(page.locator('text=Toronto, ON M5V 1A1')).toBeVisible();

    // Check payment method status
    await expect(page.locator('text=Payment method on file')).toBeVisible();
    await expect(page.locator('button:has-text("Manage")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should refresh tracking data', async ({ page }) => {
    // Mock updated tracking data
    let refreshCount = 0;
    await page.route('**/customers/cust-123/packages', async (route) => {
      refreshCount++;
      const packages = {
        packages: [
          {
            id: 'pkg-1',
            trackingNumber: 'TRACK001',
            shipmentStatus: refreshCount > 1 ? 'delivered' : 'in_transit',
            loadLocation: refreshCount > 1 ? null : {
              lat: 43.7532,
              lng: -79.2832,
              address: 'Updated Location',
              timestamp: new Date().toISOString(),
            },
            shipTo: { city: 'Toronto', province: 'ON' },
          }
        ]
      };
      await route.fulfill({ json: packages });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh Tracking")');
    await refreshButton.click();

    // Should show loading state
    await expect(page.locator('button:has-text("Refreshing...")')).toBeVisible();
    await expect(refreshButton).toBeDisabled();

    await page.waitForTimeout(1000);

    // Should update with new data
    await expect(page.locator('text=Updated Location')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle empty packages state', async ({ page }) => {
    // Mock empty packages
    await page.route('**/customers/cust-123/packages', async (route) => {
      await route.fulfill({
        json: { packages: [] }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/customer');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    await expect(page.locator('text=No packages found')).toBeVisible();
    await expect(page.locator('text=Your packages will appear here')).toBeVisible();
    
    // Summary cards should show zeros
    await expect(page.locator('text=0').first()).toBeVisible(); // Total packages
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }

    // Header should be visible
    await expect(page.locator('h1:has-text("Welcome back, John!")')).toBeVisible();
    
    // Summary cards should stack vertically on mobile
    const summaryCards = page.locator('.grid-cols-1.md\\:grid-cols-3').first();
    await expect(summaryCards).toBeVisible();

    // Table should be horizontally scrollable
    await expect(page.locator('.overflow-x-auto')).toBeVisible();
    
    // Active shipments should display properly
    if (await page.locator('h2:has-text("Active Shipments")').isVisible()) {
      await expect(page.locator('text=TRACK001')).toBeVisible();
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle package details modal on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }

    // Open package details
    await page.click('button:has-text("View Full Tracking Details")');

    // Modal should fit mobile screen
    const modal = page.locator('.fixed.inset-0 .max-w-2xl');
    await expect(modal).toBeVisible();
    
    // Content should be scrollable
    await expect(page.locator('.max-h-\\[90vh\\].overflow-y-auto')).toBeVisible();
    
    // Close button should be accessible
    await expect(page.locator('button:has-text("✕")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display tracking timeline correctly', async ({ page }) => {
    // Open package details modal
    await page.click('button:has-text("View Full Tracking Details")');

    // Check tracking history section
    await expect(page.locator('h4:has-text("Tracking History")')).toBeVisible();
    
    // Should show events in reverse chronological order (newest first)
    const historyItems = page.locator('.space-y-3 > div');
    await expect(historyItems).toHaveCount(2);
    
    // Check first item (most recent)
    const firstItem = historyItems.first();
    await expect(firstItem.locator('text=Highway 401, ON')).toBeVisible();
    
    // Check timestamps are displayed
    await expect(page.locator('text=1/20/2024')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error for customer data
    await page.route('**/customers/cust-123', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Server error' }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/customer');
    await page.waitForTimeout(2000);

    // Should still render layout without crashing
    await expect(page.locator('body')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should display different package statuses correctly', async ({ page }) => {
    // Check status styling for different states
    const inTransitBadge = page.locator('.bg-blue-100:has-text("In Transit")');
    const deliveredBadge = page.locator('.bg-green-100:has-text("Delivered")');
    const readyBadge = page.locator('.bg-gray-100:has-text("Ready for Pickup")');

    await expect(inTransitBadge).toBeVisible();
    await expect(deliveredBadge).toBeVisible();
    await expect(readyBadge).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle packages without tracking data', async ({ page }) => {
    // Package 3 (ready status) should not have tracking data
    const readyPackageRow = page.locator('tbody tr:has-text("TRACK003")');
    
    // Expected delivery should show dash
    await expect(readyPackageRow.locator('text="-"')).toBeVisible();
    
    // Click details should still work
    await readyPackageRow.locator('button').click();
    
    // Modal should open but without tracking sections
    await expect(page.locator('h3:has-text("Package Details - TRACK003")')).toBeVisible();
    await expect(page.locator('h4:has-text("Live Tracking")')).not.toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }

test.describe('Customer Portal Navigation', () => {
  test('should redirect non-customer users to login', async ({ page }) => {
    // Mock non-customer user
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        json: { user: { id: 'staff-123', role: 'staff' } }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/customer');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle unauthenticated users', async ({ page }) => {
    // Mock no user
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        json: { error: 'Unauthorized' }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/customer');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }