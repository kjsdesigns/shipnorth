import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Customer Package Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer before each test
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);
  });

  test('should display customer dashboard with package overview', async ({ page }) => {
    // Should be on customer portal page
    await expect(page).toHaveURL(new RegExp('.*/portal'));

    // Check main dashboard elements
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="package-summary"]')).toBeVisible();

    // Check navigation elements
    await expect(page.locator('[data-testid="nav-packages"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tracking"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should display package listing with search functionality', async ({ page }) => {
    await page.goto('/portal');

    // Navigate to packages section
    await page.click('[data-testid="nav-packages"]');
    await expect(page.locator('[data-testid="packages-list"]')).toBeVisible();

    // Check search functionality
    const searchInput = page.locator('[data-testid="package-search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /search packages/i);

    // Test search functionality
    await searchInput.fill('TEST');
    await page.keyboard.press('Enter');

    // Should show loading state then results
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    await page.waitForSelector('[data-testid="search-loading"]', { state: 'hidden' });

    // Check results display
    const resultsContainer = page.locator('[data-testid="search-results"]');
    await expect(resultsContainer).toBeVisible();
  });

  test('should handle package detail viewing', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Wait for packages to load
    await expect(page.locator('[data-testid="packages-list"]')).toBeVisible();

    // Click on first package if available
    const firstPackage = page.locator('[data-testid^="package-item-"]').first();

    if (await firstPackage.isVisible()) {
      await firstPackage.click();

      // Should show package details modal or page
      const packageModal = page.locator('[data-testid="package-details-modal"]');
      const packagePage = page.locator('[data-testid="package-details-page"]');

      const hasModal = await packageModal.isVisible();
      const hasPage = await packagePage.isVisible();

      expect(hasModal || hasPage).toBeTruthy();

      // Check for key package information
      if (hasModal) {
        await expect(packageModal.locator('[data-testid="package-id"]')).toBeVisible();
        await expect(packageModal.locator('[data-testid="package-status"]')).toBeVisible();
        await expect(packageModal.locator('[data-testid="tracking-timeline"]')).toBeVisible();
      } else if (hasPage) {
        await expect(packagePage.locator('[data-testid="package-id"]')).toBeVisible();
        await expect(packagePage.locator('[data-testid="package-status"]')).toBeVisible();
        await expect(packagePage.locator('[data-testid="tracking-timeline"]')).toBeVisible();
      }
    }
  });

  test('should handle tracking number lookup', async ({ page }) => {
    await page.goto('/portal');

    // Find tracking input field
    const trackingInput = page.locator('[data-testid="tracking-lookup-input"]');

    if (await trackingInput.isVisible()) {
      // Test with sample tracking number
      await trackingInput.fill('SNH123456789');
      await page.click('[data-testid="tracking-lookup-submit"]');

      // Should show loading state
      await expect(page.locator('[data-testid="tracking-lookup-loading"]')).toBeVisible();

      // Wait for results
      await page.waitForSelector('[data-testid="tracking-lookup-loading"]', { state: 'hidden' });

      // Should show either results or "not found" message
      const results = page.locator('[data-testid="tracking-results"]');
      const notFound = page.locator('[data-testid="tracking-not-found"]');

      const hasResults = await results.isVisible();
      const hasNotFound = await notFound.isVisible();

      expect(hasResults || hasNotFound).toBeTruthy();
    }
  });

  test('should display status timeline correctly', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Click on a package to view details
    const firstPackage = page.locator('[data-testid^="package-item-"]').first();

    if (await firstPackage.isVisible()) {
      await firstPackage.click();

      // Check timeline elements
      const timeline = page.locator('[data-testid="tracking-timeline"]');
      await expect(timeline).toBeVisible();

      // Check for timeline steps
      const timelineSteps = page.locator('[data-testid^="timeline-step-"]');
      expect(await timelineSteps.count()).toBeGreaterThan(0);

      // Check for status information
      await expect(page.locator('[data-testid="current-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();

      // Check for delivery information if available
      const deliveryInfo = page.locator('[data-testid="delivery-info"]');
      if (await deliveryInfo.isVisible()) {
        await expect(deliveryInfo.locator('[data-testid="delivery-address"]')).toBeVisible();
        await expect(deliveryInfo.locator('[data-testid="delivery-date"]')).toBeVisible();
      }
    }
  });

  test('should handle real-time updates simulation', async ({ page }) => {
    await page.goto('/portal');

    // Check for real-time update indicators
    const updateIndicator = page.locator('[data-testid="real-time-indicator"]');

    if (await updateIndicator.isVisible()) {
      // Should show "Live" or "Connected" status
      await expect(updateIndicator).toContainText(/live|connected|online/i);
    }

    // Check for auto-refresh functionality
    const lastUpdated = page.locator('[data-testid="last-updated-time"]');

    if (await lastUpdated.isVisible()) {
      const initialTime = await lastUpdated.textContent();

      // Wait a moment for potential updates
      await page.waitForTimeout(2000);

      // Trigger manual refresh if available
      const refreshButton = page.locator('[data-testid="refresh-tracking"]');
      if (await refreshButton.isVisible()) {
        await refreshButton.click();

        // Should show loading state
        await expect(page.locator('[data-testid="refresh-loading"]')).toBeVisible();
        await page.waitForSelector('[data-testid="refresh-loading"]', { state: 'hidden' });
      }
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/portal');

    // Check mobile navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');

    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click();
      await expect(page.locator('[data-testid="mobile-menu-overlay"]')).toBeVisible();

      // Check mobile menu items
      await expect(page.locator('[data-testid="mobile-nav-packages"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-nav-tracking"]')).toBeVisible();
    }

    // Check mobile package list layout
    await page.click('[data-testid="nav-packages"]');
    const packageList = page.locator('[data-testid="packages-list"]');
    await expect(packageList).toBeVisible();

    // Package items should stack vertically on mobile
    const packageItems = page.locator('[data-testid^="package-item-"]');
    if ((await packageItems.count()) > 1) {
      const firstItem = packageItems.first();
      const secondItem = packageItems.nth(1);

      const firstBox = await firstItem.boundingBox();
      const secondBox = await secondItem.boundingBox();

      if (firstBox && secondBox) {
        // Second item should be below the first (vertical stacking)
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
      }
    }
  });

  test('should handle empty package states', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Wait for packages to load
    await page.waitForSelector('[data-testid="packages-list"]');

    const packageItems = page.locator('[data-testid^="package-item-"]');
    const emptyState = page.locator('[data-testid="packages-empty-state"]');

    // Either show packages or empty state
    const hasPackages = (await packageItems.count()) > 0;
    const hasEmptyState = await emptyState.isVisible();

    if (!hasPackages) {
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText(/no packages|no shipments/i);
    }
  });

  test('should handle package filtering and sorting', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Check for filter options
    const filterDropdown = page.locator('[data-testid="package-filter"]');
    const sortDropdown = page.locator('[data-testid="package-sort"]');

    if (await filterDropdown.isVisible()) {
      await filterDropdown.click();

      // Check filter options
      await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-in-transit"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-delivered"]')).toBeVisible();

      // Test filtering
      await page.click('[data-testid="filter-in-transit"]');

      // Should apply filter
      await expect(page.locator('[data-testid="active-filter"]')).toContainText(/in transit/i);
    }

    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();

      // Check sort options
      await expect(page.locator('[data-testid="sort-newest"]')).toBeVisible();
      await expect(page.locator('[data-testid="sort-oldest"]')).toBeVisible();
      await expect(page.locator('[data-testid="sort-status"]')).toBeVisible();
    }
  });

  test('should handle package status notifications', async ({ page }) => {
    await page.goto('/portal');

    // Check for notification bell or indicator
    const notificationBell = page.locator('[data-testid="notification-bell"]');

    if (await notificationBell.isVisible()) {
      await notificationBell.click();

      // Should show notifications dropdown
      const notificationDropdown = page.locator('[data-testid="notifications-dropdown"]');
      await expect(notificationDropdown).toBeVisible();

      // Check for notification items
      const notifications = page.locator('[data-testid^="notification-"]');

      if ((await notifications.count()) > 0) {
        // Click on first notification
        await notifications.first().click();

        // Should navigate to relevant package or show details
        // Exact behavior depends on implementation
      }
    }
  });

  test('should handle package photos and signatures', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Click on a package to view details
    const firstPackage = page.locator('[data-testid^="package-item-"]').first();

    if (await firstPackage.isVisible()) {
      await firstPackage.click();

      // Check for delivery photos
      const deliveryPhotos = page.locator('[data-testid="delivery-photos"]');
      if (await deliveryPhotos.isVisible()) {
        const photos = page.locator('[data-testid^="delivery-photo-"]');

        if ((await photos.count()) > 0) {
          // Click on photo to open gallery
          await photos.first().click();
          await expect(page.locator('[data-testid="photo-gallery-modal"]')).toBeVisible();

          // Check for navigation controls
          await expect(page.locator('[data-testid="photo-prev"]')).toBeVisible();
          await expect(page.locator('[data-testid="photo-next"]')).toBeVisible();
          await expect(page.locator('[data-testid="photo-close"]')).toBeVisible();

          // Close gallery
          await page.click('[data-testid="photo-close"]');
        }
      }

      // Check for signature
      const signature = page.locator('[data-testid="delivery-signature"]');
      if (await signature.isVisible()) {
        await signature.click();

        // Should show signature modal or full view
        await expect(page.locator('[data-testid="signature-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="signature-image"]')).toBeVisible();
      }
    }
  });

  test('should handle tracking export functionality', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Check for export button
    const exportButton = page.locator('[data-testid="export-packages"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Should show export options
      const exportModal = page.locator('[data-testid="export-modal"]');
      await expect(exportModal).toBeVisible();

      // Check export format options
      await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();

      // Test CSV export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-csv"]'),
      ]);

      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('should handle tracking link sharing', async ({ page }) => {
    await page.goto('/portal');
    await page.click('[data-testid="nav-packages"]');

    // Click on a package
    const firstPackage = page.locator('[data-testid^="package-item-"]').first();

    if (await firstPackage.isVisible()) {
      await firstPackage.click();

      // Check for share button
      const shareButton = page.locator('[data-testid="share-tracking"]');

      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Should show share modal
        const shareModal = page.locator('[data-testid="share-modal"]');
        await expect(shareModal).toBeVisible();

        // Check for tracking URL
        const trackingUrl = page.locator('[data-testid="tracking-url"]');
        await expect(trackingUrl).toBeVisible();

        // Test copy to clipboard functionality
        const copyButton = page.locator('[data-testid="copy-tracking-url"]');
        if (await copyButton.isVisible()) {
          await copyButton.click();

          // Should show success message
          await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
        }
      }
    }
  });
});
