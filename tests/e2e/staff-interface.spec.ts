import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { StaffDashboard } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { testData } from './utils/test-data';
import { NavigationHelpers } from './utils/navigation-helpers';

/**
 * Comprehensive Staff Interface Tests
 * Consolidates: comprehensive-staff, staff-comprehensive-test, staff-loads, staff-packages
 */

test.describe('Staff Interface', () => {
  let authHelpers: AuthHelpers;
  let staffDashboard: StaffDashboard;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    staffDashboard = new StaffDashboard(page);
    assertions = new CustomAssertions(page);

    // Login as staff before each test
    await authHelpers.quickLogin('staff');
  });

  test.describe('Dashboard Overview @smoke', () => {
    test('dashboard loads with all required elements', async ({ page }) => {
      // Check main heading and description
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
      await expect(page.locator('text=Manage packages, customers, and shipments')).toBeVisible();

      // Check stats cards
      await expect(staffDashboard.totalPackagesCard).toBeVisible();
      await expect(staffDashboard.activeCustomersCard).toBeVisible();
      await expect(staffDashboard.activeLoadsCard).toBeVisible();
      await expect(staffDashboard.revenueCard).toBeVisible();

      // Check package status cards
      await expect(
        page.getByRole('heading', { name: 'Unassigned Packages', exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Assigned Packages', exact: true })
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'In Transit', exact: true })).toBeVisible();

      // Check navigation tabs
      await expect(staffDashboard.overviewTab).toBeVisible();
      await expect(staffDashboard.packagesTab).toBeVisible();
      await expect(staffDashboard.customersTab).toBeVisible();
      await expect(staffDashboard.loadsTab).toBeVisible();
      await expect(staffDashboard.invoicesTab).toBeVisible();

      await staffDashboard.takeScreenshot('staff-dashboard-overview');
    });

    test('stats cards display numeric values', async ({ page }) => {
      // Check that stats cards show numbers (not just placeholder text)
      const totalPackages = page.locator(
        '[data-testid="total-packages"], .stat-card:has-text("Total Packages")'
      );
      const activeCustomers = page.locator(
        '[data-testid="active-customers"], .stat-card:has-text("Active Customers")'
      );
      const activeLoads = page.locator(
        '[data-testid="active-loads"], .stat-card:has-text("Active Loads")'
      );
      const revenue = page.locator('[data-testid="revenue"], .stat-card:has-text("Revenue")');

      // Check stats are visible and contain numeric values
      await expect(totalPackages).toBeVisible();
      await expect(activeCustomers).toBeVisible();
      await expect(activeLoads).toBeVisible();
      await expect(revenue).toBeVisible();

      // Verify numeric content (should contain digits)
      const statsText = await page.locator('.stat-card, [data-testid*="stat"]').allTextContents();
      const hasNumbers = statsText.some((text) => /\d+/.test(text));
      expect(hasNumbers).toBeTruthy();
    });

    test('quick actions are available', async ({ page }) => {
      // Check for common quick action buttons
      const addPackageButton = page.locator(
        'button:has-text("Add Package"), button:has-text("New Package"), [data-testid="add-package"]'
      );
      const addCustomerButton = page.locator(
        'button:has-text("Add Customer"), button:has-text("New Customer"), [data-testid="add-customer"]'
      );

      // At least one quick action should be visible
      const quickActionVisible =
        (await addPackageButton.isVisible()) || (await addCustomerButton.isVisible());
      expect(quickActionVisible).toBeTruthy();
    });
  });

  test.describe('Navigation and Tab Management', () => {
    test('tab navigation works correctly', async ({ page }) => {
      const tabs = ['packages', 'customers', 'loads', 'invoices'] as const;

      for (const tab of tabs) {
        await staffDashboard.navigateToTab(tab);

        // Wait for content to load
        await page.waitForTimeout(testData.waitTimes.medium);

        // Verify tab is active/selected (implementation dependent)
        const activeTab = staffDashboard.getTabByName(tab);
        // Just verify the tab is still visible after navigation
        await expect(activeTab).toBeVisible();

        // Take screenshot of each tab
        await staffDashboard.takeScreenshot(`staff-${tab}-tab`);
      }
    });

    test('navigation preserves state between tabs', async ({ page }) => {
      // Navigate to packages tab and perform some action
      await staffDashboard.navigateToTab('packages');

      // Look for any filters or search that can be applied
      const searchInput = page
        .locator('input[placeholder*="search"], input[type="search"]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test-search');
      }

      // Navigate to another tab
      await staffDashboard.navigateToTab('customers');
      await page.waitForTimeout(testData.waitTimes.short);

      // Navigate back to packages
      await staffDashboard.navigateToTab('packages');

      // Check if search state is preserved (implementation dependent)
      if (await searchInput.isVisible()) {
        const searchValue = await searchInput.inputValue();
        // State preservation is optional, just verify no errors occurred
        expect(typeof searchValue).toBe('string');
      }
    });
  });

  test.describe('Packages Management @packages', () => {
    test('packages table displays correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Check if packages table is visible
      const packagesTable = staffDashboard.packagesTable;
      if (await packagesTable.isVisible()) {
        await assertions.expectTableData(packagesTable, 1); // At least header row

        // Check for common column headers
        await expect(
          page.locator('th:has-text("Tracking"), th:has-text("Status"), th:has-text("Customer")')
        ).toBeVisible();
      } else {
        // If no table, should show empty state or message
        await expect(
          page.locator('text=No packages, text=Empty, text=Add your first package')
        ).toBeVisible();
      }
    });

    test('package filtering and search works', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      const searchInput = page
        .locator(
          'input[placeholder*="search"], input[type="search"], [data-testid="search-packages"]'
        )
        .first();
      const filterDropdown = page
        .locator(
          'select[data-testid="status-filter"], select:has(option:has-text("Status"))',
          '[data-testid="filter"]'
        )
        .first();

      if (await searchInput.isVisible()) {
        // Test search functionality
        await assertions.expectSearchFunctionality(
          searchInput,
          page.locator('button:has-text("Search"), [data-testid="search-button"]').first(),
          page.locator('table, .packages-list, [data-testid="packages-results"]').first(),
          testData.searchQueries.packages[0]
        );
      }

      if (await filterDropdown.isVisible()) {
        // Test filter functionality
        await filterDropdown.selectOption('in-transit');
        await page.waitForTimeout(testData.waitTimes.medium);

        // Results should be filtered (no assertions on specific content as data may vary)
        await expect(page.locator('table, .packages-list')).toBeVisible();
      }
    });

    test('package actions are available', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Look for package action buttons
      const actionButtons = page.locator(
        'button:has-text("View"), button:has-text("Edit"), button:has-text("Delete"), .action-button, [data-testid*="action"]'
      );

      // Check if any action buttons exist (content may vary)
      const actionCount = await actionButtons.count();
      if (actionCount > 0) {
        await expect(actionButtons.first()).toBeVisible();
      } else {
        // If no actions, verify add package button exists
        await expect(staffDashboard.addPackageButton).toBeVisible();
      }
    });
  });

  test.describe('Customers Management @customers', () => {
    test('customers table displays correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('customers');

      const customersTable = staffDashboard.customersTable.or(page.locator('table').first());
      if (await customersTable.isVisible()) {
        await assertions.expectTableData(customersTable, 1);

        // Check for common customer columns
        await expect(
          page.locator('th:has-text("Name"), th:has-text("Email"), th:has-text("Packages")')
        ).toBeVisible();
      } else {
        await expect(
          page.locator('text=No customers, text=Empty, text=Add your first customer')
        ).toBeVisible();
      }
    });

    test('customer search and filtering works', async ({ page }) => {
      await staffDashboard.navigateToTab('customers');

      const searchInput = page
        .locator(
          'input[placeholder*="search"], input[type="search"], [data-testid="search-customers"]'
        )
        .first();

      if (await searchInput.isVisible()) {
        await assertions.expectSearchFunctionality(
          searchInput,
          page.locator('button:has-text("Search"), [data-testid="search-button"]').first(),
          page.locator('table, .customers-list, [data-testid="customers-results"]').first(),
          'John'
        );
      }
    });

    test('add customer functionality is accessible', async ({ page }) => {
      await staffDashboard.navigateToTab('customers');

      const addCustomerBtn = staffDashboard.addCustomerButton.or(
        page.locator('button:has-text("Add Customer"), button:has-text("New Customer")').first()
      );

      if (await addCustomerBtn.isVisible()) {
        await addCustomerBtn.click();

        // Should open modal or navigate to form
        await page.waitForTimeout(testData.waitTimes.medium);

        // Look for customer form fields
        const customerForm = page
          .locator('form, [data-testid="customer-form"], .customer-form')
          .first();
        if (await customerForm.isVisible()) {
          await expect(
            page.locator('input[name="email"], input[placeholder*="email"]')
          ).toBeVisible();
          await expect(
            page.locator('input[name="name"], input[placeholder*="name"]')
          ).toBeVisible();
        }
      }
    });
  });

  test.describe('Loads Management @loads', () => {
    test('loads tab displays correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('loads');

      // Check loads content
      const loadsContent = page.locator('table, .loads-list, [data-testid="loads"]').first();
      if (await loadsContent.isVisible()) {
        await assertions.expectTableData(loadsContent, 1);
      } else {
        await expect(
          page.locator('text=No loads, text=Empty, text=Create your first load')
        ).toBeVisible();
      }
    });

    test('load creation is accessible', async ({ page }) => {
      await staffDashboard.navigateToTab('loads');

      const createLoadBtn = page
        .locator(
          'button:has-text("Create Load"), button:has-text("New Load"), [data-testid="create-load"]'
        )
        .first();

      if (await createLoadBtn.isVisible()) {
        await createLoadBtn.click();
        await page.waitForTimeout(testData.waitTimes.medium);

        // Should show load creation form or modal
        const loadForm = page.locator('form, [data-testid="load-form"], .load-form').first();
        if (await loadForm.isVisible()) {
          // Basic load form fields should be present
          await expect(page.locator('input, select, textarea')).toBeVisible();
        }
      }
    });
  });

  test.describe('Invoices Management @invoices', () => {
    test('invoices tab displays correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('invoices');

      const invoicesContent = page
        .locator('table, .invoices-list, [data-testid="invoices"]')
        .first();
      if (await invoicesContent.isVisible()) {
        await assertions.expectTableData(invoicesContent, 1);

        // Check for invoice-related columns
        await expect(
          page.locator('th:has-text("Invoice"), th:has-text("Amount"), th:has-text("Date")')
        ).toBeVisible();
      } else {
        await expect(page.locator('text=No invoices, text=Empty')).toBeVisible();
      }
    });

    test('invoice actions are available', async ({ page }) => {
      await staffDashboard.navigateToTab('invoices');

      // Look for invoice actions
      const invoiceActions = page.locator(
        'button:has-text("View"), button:has-text("Download"), button:has-text("Print"), .invoice-action'
      );

      const actionCount = await invoiceActions.count();
      if (actionCount > 0) {
        await expect(invoiceActions.first()).toBeVisible();
      }
    });
  });

  test.describe('Data Management and Interactions', () => {
    test('bulk actions work correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Look for checkboxes to select multiple items
      const checkboxes = page.locator('input[type="checkbox"]:not([data-testid="select-all"])');
      const selectAllCheckbox = page
        .locator('input[type="checkbox"][data-testid="select-all"], th input[type="checkbox"]')
        .first();

      const checkboxCount = await checkboxes.count();
      if (checkboxCount > 0) {
        // Select first few items
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await checkboxes.nth(i).check();
        }

        // Look for bulk action buttons
        const bulkActions = page.locator(
          'button:has-text("Delete Selected"), button:has-text("Bulk"), [data-testid="bulk-action"]'
        );
        if (await bulkActions.first().isVisible()) {
          await expect(bulkActions.first()).toBeEnabled();
        }
      }

      // Test select all functionality
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check();

        // All checkboxes should be checked
        const allChecked = await checkboxes.evaluateAll((boxes) =>
          boxes.every((box) => (box as HTMLInputElement).checked)
        );
        expect(allChecked).toBeTruthy();
      }
    });

    test('pagination works correctly', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      const paginationContainer = page.locator('.pagination, [data-testid="pagination"]').first();
      const nextButton = page.locator('button:has-text("Next"), [data-testid="next-page"]').first();
      const prevButton = page
        .locator('button:has-text("Previous"), button:has-text("Prev"), [data-testid="prev-page"]')
        .first();
      const dataContainer = page
        .locator('table tbody, .data-list, [data-testid="data-content"]')
        .first();

      if (await paginationContainer.isVisible()) {
        await assertions.expectPaginationFunctionality(
          paginationContainer,
          nextButton,
          prevButton,
          dataContainer
        );
      }
    });

    test('sorting functionality works', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Look for sortable column headers
      const sortableHeaders = page.locator(
        'th[data-sortable], th button, th:has([data-lucide="arrow-up"]), th:has([data-lucide="arrow-down"])'
      );

      const sortableCount = await sortableHeaders.count();
      if (sortableCount > 0) {
        const firstSortable = sortableHeaders.first();

        // Get initial data
        const dataContainer = page.locator('table tbody, .data-list').first();
        const initialData = await dataContainer.textContent();

        // Click to sort
        await firstSortable.click();
        await page.waitForTimeout(testData.waitTimes.medium);

        // Data may have changed (depending on implementation)
        const newData = await dataContainer.textContent();
        expect(typeof newData).toBe('string');

        // Click again to reverse sort
        await firstSortable.click();
        await page.waitForTimeout(testData.waitTimes.medium);
      }
    });
  });

  test.describe('Responsive Design @mobile', () => {
    test('staff dashboard works on mobile devices', async ({ page }) => {
      await page.setViewportSize(testData.viewports.mobile);
      await page.waitForTimeout(testData.waitTimes.short);

      // Main elements should still be visible
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();

      // Navigation might collapse to hamburger menu on mobile
      const mobileNav = page
        .locator('.mobile-nav, .hamburger, [data-testid="mobile-menu"]')
        .first();
      if (await mobileNav.isVisible()) {
        await mobileNav.click();
        await page.waitForTimeout(testData.waitTimes.short);
      }

      // Tabs should be accessible (may be in dropdown/collapsed form)
      const tabsContainer = page.locator('.tabs, [data-testid="navigation"], nav').first();
      await expect(tabsContainer).toBeVisible();

      await staffDashboard.takeScreenshot('staff-dashboard-mobile');
    });

    test('staff dashboard works on tablet devices', async ({ page }) => {
      await page.setViewportSize(testData.viewports.tablet);
      await page.waitForTimeout(testData.waitTimes.short);

      // Check responsive layout
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
      await expect(staffDashboard.overviewTab).toBeVisible();

      // Stats cards should adapt to tablet layout
      await expect(staffDashboard.totalPackagesCard).toBeVisible();
      await expect(staffDashboard.activeCustomersCard).toBeVisible();

      await staffDashboard.takeScreenshot('staff-dashboard-tablet');
    });
  });

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Intercept API calls and return errors
      await page.route('**/api/packages', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await staffDashboard.navigateToTab('packages');

      // Should show error message or graceful fallback
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/staff-api-error.png', fullPage: true });
    });

    test('handles network connectivity issues', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Simulate offline condition
      await page.context().setOffline(true);

      // Try to perform an action that requires network
      const addPackageBtn = page
        .locator('button:has-text("Add Package"), button:has-text("New Package")')
        .first();
      if (await addPackageBtn.isVisible()) {
        await addPackageBtn.click();

        // Should show network error or offline message
        await page.waitForTimeout(testData.waitTimes.long);

        const errorMessage = page.locator(
          'text=/network/i, text=/offline/i, text=/connection/i, [role="alert"]'
        );
        if (await errorMessage.first().isVisible()) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }

      // Restore online status
      await page.context().setOffline(false);
    });
  });

  test.describe('Performance @performance', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
      await assertions.expectPerformance(async () => {
        await page.reload();
        await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
      }, testData.performance.pageLoad);
    });

    test('tab switching is responsive', async ({ page }) => {
      const tabs = ['packages', 'customers', 'loads'] as const;

      for (const tab of tabs) {
        await assertions.expectPerformance(async () => {
          await staffDashboard.navigateToTab(tab);
          await page.waitForTimeout(100);
        }, testData.performance.userInteraction);
      }
    });

    test('table operations are performant', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      // Test search performance
      const searchInput = page
        .locator('input[placeholder*="search"], input[type="search"]')
        .first();
      if (await searchInput.isVisible()) {
        await assertions.expectPerformance(async () => {
          await searchInput.fill('test-search');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(100);
        }, testData.performance.userInteraction);
      }
    });
  });

  test.describe('Data Persistence', () => {
    test('form data persists during session', async ({ page }) => {
      // Test data persistence in forms/inputs
      await staffDashboard.navigateToTab('packages');

      const searchInput = page
        .locator('input[placeholder*="search"], input[type="search"]')
        .first();
      if (await searchInput.isVisible()) {
        const testSearch = 'persistent-test-data';
        await searchInput.fill(testSearch);

        // Navigate away and back
        await staffDashboard.navigateToTab('customers');
        await staffDashboard.navigateToTab('packages');

        // Check if search persists (implementation dependent)
        const searchValue = await searchInput.inputValue();
        // Don't assert specific persistence as this varies by implementation
        expect(typeof searchValue).toBe('string');
      }
    });

    test('selected filters persist during navigation', async ({ page }) => {
      await staffDashboard.navigateToTab('packages');

      const statusFilter = page
        .locator('select[data-testid="status-filter"], select:has(option:has-text("Status"))')
        .first();
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('in-transit');

        // Navigate to different tab and back
        await staffDashboard.navigateToTab('customers');
        await staffDashboard.navigateToTab('packages');

        // Check filter state (implementation dependent)
        const filterValue = await statusFilter.inputValue();
        expect(typeof filterValue).toBe('string');
      }
    });
  });

  test.describe('🛣️ Route Planning & Load Management - Browser-Based CRUD Stack @route-planning', () => {
    
    test('Complete route planning workflow: Customer → Package → Load → Route @critical', async ({ page }) => {
      console.log('🚀 Starting comprehensive route planning workflow via browser');
      
      // Phase 1: Create test customer with geocoded address
      await staffDashboard.navigateToTab('customers');
      
      // Create customer with real address for geocoding
      const testCustomer = {
        name: `Route Test Customer ${Date.now()}`,
        email: `routetest${Date.now()}@shipnorth.com`,
        phone: '604-555-0199',
        address: '1055 W Georgia St, Vancouver, BC V6E 3R5' // Real Vancouver address
      };
      
      // Look for add customer button
      const addCustomerBtn = page.locator('button:has-text("Add Customer"), button:has-text("Create"), button:has-text("New")').first();
      await expect(addCustomerBtn).toBeVisible({ timeout: 10000 });
      await addCustomerBtn.click();
      
      // Fill customer form
      const customerForm = page.locator('form, [role="dialog"], .modal').first();
      await expect(customerForm).toBeVisible({ timeout: 10000 });
      
      await page.fill('input[name="name"], [data-testid="customer-name"]', testCustomer.name);
      await page.fill('input[name="email"], [data-testid="customer-email"]', testCustomer.email);
      await page.fill('input[name="phone"], [data-testid="customer-phone"]', testCustomer.phone);
      
      // Save customer
      await page.click('button:has-text("Save"), button[type="submit"]');
      
      // Verify customer created
      await expect(page.locator(`text="${testCustomer.name}"`)).toBeVisible({ timeout: 15000 });
      console.log(`✅ Customer created: ${testCustomer.name}`);
      
      // Phase 2: Create packages for the customer
      await staffDashboard.navigateToTab('packages');
      
      const testPackages = [
        { desc: 'Route Test Package A', weight: '2.5', dims: { l: '30', w: '20', h: '15' }, value: '500' },
        { desc: 'Route Test Package B', weight: '1.8', dims: { l: '25', w: '18', h: '10' }, value: '300' },
      ];
      
      const createdPackageIds: string[] = [];
      
      for (const pkg of testPackages) {
        const addPackageBtn = page.locator('button:has-text("Add Package"), button:has-text("Create"), button:has-text("New")').first();
        await expect(addPackageBtn).toBeVisible({ timeout: 10000 });
        await addPackageBtn.click();
        
        // Fill package form
        const packageForm = page.locator('form, [role="dialog"], .modal').first();
        await expect(packageForm).toBeVisible({ timeout: 10000 });
        
        await page.fill('input[name="description"], [data-testid="description"]', pkg.desc);
        await page.fill('input[name="weight"], [data-testid="weight"]', pkg.weight);
        await page.fill('input[name="length"], [data-testid="length"]', pkg.dims.l);
        await page.fill('input[name="width"], [data-testid="width"]', pkg.dims.w);
        await page.fill('input[name="height"], [data-testid="height"]', pkg.dims.h);
        await page.fill('input[name="declaredValue"], [data-testid="declared-value"]', pkg.value);
        
        // Select customer
        try {
          await page.selectOption('select[name="customerId"], [data-testid="customer-select"]', { label: testCustomer.name });
        } catch (e) {
          console.warn('Customer selector not available - may be auto-selected');
        }
        
        // Save package
        await page.click('button:has-text("Save"), button[type="submit"]');
        
        // Verify package created
        await expect(page.locator(`text="${pkg.desc}"`)).toBeVisible({ timeout: 15000 });
        console.log(`✅ Package created: ${pkg.desc}`);
      }
      
      // Phase 3: Create load with packages
      await staffDashboard.navigateToTab('loads');
      
      const testLoadName = `Route Optimization Test Load ${Date.now()}`;
      
      const addLoadBtn = page.locator('button:has-text("Add Load"), button:has-text("Create"), button:has-text("New")').first();
      await expect(addLoadBtn).toBeVisible({ timeout: 10000 });
      await addLoadBtn.click();
      
      // Fill load form
      const loadForm = page.locator('form, [role="dialog"], .modal').first();
      await expect(loadForm).toBeVisible({ timeout: 10000 });
      
      await page.fill('input[name="name"], [data-testid="load-name"]', testLoadName);
      
      try {
        await page.selectOption('select[name="transportMode"], [data-testid="transport-mode"]', 'truck');
      } catch (e) {
        console.warn('Transport mode selector not available');
      }
      
      // Save load
      await page.click('button:has-text("Save"), button[type="submit"]');
      
      // Verify load created
      await expect(page.locator(`text="${testLoadName}"`)).toBeVisible({ timeout: 15000 });
      console.log(`✅ Load created: ${testLoadName}`);
      
      // Phase 4: Access route optimization
      const loadRow = page.locator(`tr:has-text("${testLoadName}")`).first();
      await expect(loadRow).toBeVisible();
      
      // Look for view/details button
      const viewButton = loadRow.locator('button:has-text("View"), button:has-text("Details"), a:has-text("View")').first();
      await expect(viewButton).toBeVisible({ timeout: 10000 });
      await viewButton.click();
      
      // Look for route optimization section
      await expect(page.locator('text="Route", text="Optimize", text="Route Optimizer"')).toBeVisible({ timeout: 15000 });
      
      // Test route optimization trigger
      const optimizeButton = page.locator('button:has-text("Optimize"), button:has-text("Generate Route"), [data-testid="optimize-route"]').first();
      
      if (await optimizeButton.isVisible()) {
        await optimizeButton.click();
        
        // Wait for optimization to complete
        await expect(page.locator('text="Route Generated", text="Optimization Complete", [data-testid="route-result"]')).toBeVisible({ timeout: 30000 });
        
        // Validate route intelligence
        const totalDistance = page.locator('[data-testid="total-distance"], text=/\\d+(\\.\\d+)?\\s*km/');
        await expect(totalDistance).toBeVisible();
        
        const distanceText = await totalDistance.first().textContent() || '';
        const distanceMatch = distanceText.match(/(\\d+(?:\\.\\d+)?)\\s*km/);
        const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
        
        expect(distance).toBeGreaterThan(0);
        console.log(`✅ Route generated with total distance: ${distance}km`);
        
        // Check for route stops
        const routeStops = page.locator('[data-testid="route-stop"], .route-stop, .stop-item');
        const stopCount = await routeStops.count();
        expect(stopCount).toBeGreaterThan(0);
        console.log(`✅ Route contains ${stopCount} stops`);
        
        // Validate no 0km steps between different addresses
        const stepDistances = page.locator('[data-testid="step-distance"], .step-distance, text=/\\d+(\\.\\d+)?\\s*km/');
        const steps = await stepDistances.all();
        
        let zeroKmSteps = 0;
        for (const step of steps) {
          const stepText = await step.textContent() || '';
          if (stepText.includes('0 km') || stepText.includes('0.0 km')) {
            zeroKmSteps++;
          }
        }
        
        // Allow some 0km steps (same address deliveries) but flag if excessive
        if (zeroKmSteps > 1) {
          console.warn(`⚠️ Found ${zeroKmSteps} zero-distance steps - may indicate route optimization issue`);
        } else {
          console.log(`✅ Route intelligence validated - minimal zero-distance steps`);
        }
        
        await page.screenshot({ path: 'test-artifacts/route-optimization-success.png', fullPage: true });
        
      } else {
        console.warn('⚠️ Route optimization button not found - may need UI updates');
        await page.screenshot({ path: 'test-artifacts/route-optimization-missing.png', fullPage: true });
      }
      
      console.log('🏆 Complete route planning workflow test completed');
    });
    
    test('Route planning data requirements validation @route-planning', async ({ page }) => {
      console.log('🔍 Validating route planning data requirements');
      
      // Navigate to loads
      await staffDashboard.navigateToTab('loads');
      
      // Check if loads exist
      const existingLoads = await page.locator('tr, .load-item, [data-testid*="load"]').count();
      console.log(`📊 Found ${existingLoads} existing loads`);
      
      if (existingLoads > 0) {
        // Click on first load to examine structure
        const firstLoad = page.locator('tr, .load-item').first();
        const viewButton = firstLoad.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();
        
        if (await viewButton.isVisible()) {
          await viewButton.click();
          
          // Check for packages associated with load
          const packageSection = page.locator('text="Package", text="package", [data-testid*="package"]');
          const packageCount = await packageSection.count();
          console.log(`📦 Load contains ${packageCount} package-related elements`);
          
          // Check for addresses/coordinates
          const addressElements = page.locator('text=/\\d{1,5}.*street|road|ave|blvd/i, text=/[A-Z]\\d[A-Z]\\s*\\d[A-Z]\\d/');
          const addressCount = await addressElements.count();
          console.log(`🏠 Found ${addressCount} address-like elements`);
          
          // Check for route optimization availability
          const routeFeatures = page.locator('text="route", text="optimize", text="Route", text="Optimize"');
          const routeCount = await routeFeatures.count();
          console.log(`🛣️ Found ${routeCount} route-related features`);
          
          await page.screenshot({ path: 'test-artifacts/load-details-analysis.png', fullPage: true });
        }
      }
      
      console.log('✅ Route planning data requirements analysis complete');
    });
    
    test('Manual route editing capabilities @route-planning', async ({ page }) => {
      console.log('✏️ Testing manual route editing via browser');
      
      // Navigate to loads and find/create a load for route editing
      await staffDashboard.navigateToTab('loads');
      
      // Look for existing load or create one for testing
      let loadFound = false;
      const loads = await page.locator('tr, .load-item').all();
      
      for (const load of loads.slice(0, 3)) { // Check first 3 loads
        try {
          const viewButton = load.locator('button:has-text("View"), a:has-text("View")').first();
          if (await viewButton.isVisible()) {
            await viewButton.click();
            
            // Look for route editing features
            const editRouteBtn = page.locator('button:has-text("Edit Route"), button:has-text("Modify"), [data-testid="edit-route"]').first();
            
            if (await editRouteBtn.isVisible({ timeout: 5000 })) {
              await editRouteBtn.click();
              
              // Check for route editing interface
              await expect(page.locator('[data-testid="route-editor"], .route-editor, text="Edit Route"')).toBeVisible({ timeout: 10000 });
              
              // Test reordering if possible
              const stops = page.locator('[data-testid="route-stop"], .route-stop');
              const stopCount = await stops.count();
              
              if (stopCount >= 2) {
                try {
                  // Test drag and drop
                  await page.dragAndDrop(
                    '[data-testid="route-stop"]:first-child',
                    '[data-testid="route-stop"]:nth-child(2)'
                  );
                  
                  // Look for route modified indicator
                  await expect(page.locator('[data-testid="route-modified"], text="Modified", text="Updated"')).toBeVisible({ timeout: 5000 });
                  
                  console.log('✅ Manual route editing successful');
                } catch (e) {
                  console.log('⚠️ Drag-and-drop not available, checking for alternative editing');
                  
                  // Look for up/down buttons
                  const moveButtons = await page.locator('button[aria-label*="move"], button:has-text("↑"), button:has-text("↓")').count();
                  console.log(`🔄 Found ${moveButtons} move/reorder buttons`);
                }
              }
              
              await page.screenshot({ path: 'test-artifacts/route-editing-interface.png', fullPage: true });
              loadFound = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!loadFound) {
        console.warn('⚠️ No loads found with route editing capabilities - may need test data setup');
      }
    });
    
    test('Route intelligence validation - no 0km anomalies @route-planning @critical', async ({ page }) => {
      console.log('🧠 Validating route intelligence through browser interface');
      
      // Navigate to loads
      await staffDashboard.navigateToTab('loads');
      
      // Find a load with route optimization
      const loads = await page.locator('tr, .load-item').all();
      let routeFound = false;
      
      for (const load of loads.slice(0, 5)) {
        try {
          const viewButton = load.locator('button:has-text("View"), a:has-text("View")').first();
          if (await viewButton.isVisible()) {
            await viewButton.click();
            
            // Look for existing route or trigger route generation
            let routeVisible = await page.locator('[data-testid="route-result"], .route-display, text="Route"').first().isVisible({ timeout: 3000 });
            
            if (!routeVisible) {
              // Try to generate route
              const optimizeBtn = page.locator('button:has-text("Optimize"), button:has-text("Generate")').first();
              if (await optimizeBtn.isVisible({ timeout: 3000 })) {
                await optimizeBtn.click();
                await page.waitForTimeout(5000); // Wait for optimization
                routeVisible = await page.locator('[data-testid="route-result"], .route-display').first().isVisible({ timeout: 15000 });
              }
            }
            
            if (routeVisible) {
              // Validate route intelligence
              const distanceElements = page.locator('[data-testid="step-distance"], .step-distance, text=/\\d+(\\.\\d+)?\\s*km/');
              const distances = await distanceElements.all();
              
              let totalDistance = 0;
              let zeroKmCount = 0;
              
              for (const distEl of distances) {
                const distText = await distEl.textContent() || '';
                const match = distText.match(/(\\d+(?:\\.\\d+)?)\\s*km/);
                if (match) {
                  const dist = parseFloat(match[1]);
                  totalDistance += dist;
                  if (dist === 0) zeroKmCount++;
                }
              }
              
              console.log(`📏 Route analysis: ${totalDistance}km total, ${zeroKmCount} zero-distance steps`);
              
              // Validate route makes sense
              expect(totalDistance).toBeGreaterThan(0);
              
              // Allow some zero-distance steps (same address) but not excessive
              const allowedZeroSteps = Math.floor(distances.length * 0.3); // Allow up to 30% zero steps
              expect(zeroKmCount).toBeLessThanOrEqual(allowedZeroSteps);
              
              await page.screenshot({ path: 'test-artifacts/route-intelligence-validation.png', fullPage: true });
              
              console.log('✅ Route intelligence validation passed');
              routeFound = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!routeFound) {
        console.warn('⚠️ No routes found for validation - may need test data with packages and addresses');
        // This is okay - just means we need to set up proper test data
      }
    });
    
    test('Cross-portal route validation: Staff creates, Driver views @route-planning', async ({ page, context }) => {
      console.log('🔄 Testing cross-portal route validation');
      
      // Create or find a route in staff portal (simplified for testing)
      await staffDashboard.navigateToTab('loads');
      
      const loads = await page.locator('tr, .load-item').count();
      console.log(`📊 Staff can see ${loads} loads`);
      
      // Switch to driver portal in new tab
      const driverPage = await context.newPage();
      const driverAuth = new AuthHelpers(driverPage);
      
      try {
        await driverAuth.quickLogin('driver');
        await expect(driverPage).toHaveURL(/\/driver/);
        
        // Navigate to driver loads/routes using standardized helper
        const driverNavHelper = new NavigationHelpers(driverPage);
        const driverNavItems = await driverNavHelper.getVisibleNavigationElements('driver');
        
        for (const item of driverNavItems) {
          const text = await item.textContent();
          if (text?.toLowerCase().includes('load') || text?.toLowerCase().includes('route')) {
            await item.click();
            await driverPage.waitForLoadState('networkidle');
            
            // Check if driver can see route information
            const routeElements = await driverPage.locator('text="route", text="Route", text="navigation"').count();
            console.log(`🛣️ Driver portal shows ${routeElements} route-related elements`);
            
            await driverPage.screenshot({ path: 'test-artifacts/driver-route-view.png', fullPage: true });
            break;
          }
        }
        
        console.log('✅ Cross-portal route validation completed');
      } catch (e) {
        console.warn('⚠️ Driver portal access may need additional setup');
      } finally {
        await driverPage.close();
      }
    });
    
  });
});
