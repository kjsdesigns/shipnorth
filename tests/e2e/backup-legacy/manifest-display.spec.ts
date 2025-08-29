import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Manifest Display for Drivers', () => {
  test.beforeEach(async ({ page }) => {
    // Login as driver
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.driver.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.driver.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);
  });

  test('should display manifest loading interface', async ({ page }) => {
    await page.goto('/driver');

    // Look for manifest access button
    const manifestButton = page.locator(
      '[data-testid="view-manifest"], [data-testid="load-manifest"]'
    );
    await expect(manifestButton).toBeVisible();

    await manifestButton.click();

    // Should open manifest interface
    const manifestInterface = page.locator(
      '[data-testid="manifest-display"], [data-testid="load-manifest-modal"]'
    );
    await expect(manifestInterface).toBeVisible();

    // Check for loading states if manifest is being fetched
    const loadingIndicator = page.locator('[data-testid="manifest-loading"]');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toContainText(/loading|fetching/i);
      await page.waitForSelector('[data-testid="manifest-loading"]', { state: 'hidden' });
    }

    // Should show manifest content
    await expect(page.locator('[data-testid="manifest-content"]')).toBeVisible();
  });

  test('should display package list with delivery sequence', async ({ page }) => {
    await page.goto('/driver');

    // Open manifest
    await page.click('[data-testid="view-manifest"]');
    await expect(page.locator('[data-testid="manifest-display"]')).toBeVisible();

    // Check for package list
    const packageList = page.locator('[data-testid="manifest-package-list"]');
    await expect(packageList).toBeVisible();

    // Check for delivery sequence numbers
    const sequenceNumbers = page.locator('[data-testid^="sequence-"]');
    if ((await sequenceNumbers.count()) > 0) {
      const firstSequence = sequenceNumbers.first();
      await expect(firstSequence).toContainText(/1|first/i);

      if ((await sequenceNumbers.count()) > 1) {
        const secondSequence = sequenceNumbers.nth(1);
        await expect(secondSequence).toContainText(/2|second/i);
      }
    }

    // Check package items have required information
    const packageItems = page.locator('[data-testid^="manifest-package-"]');
    if ((await packageItems.count()) > 0) {
      const firstPackage = packageItems.first();

      // Each package should show key information
      await expect(firstPackage.locator('[data-testid="package-id"]')).toBeVisible();
      await expect(firstPackage.locator('[data-testid="recipient-name"]')).toBeVisible();
      await expect(firstPackage.locator('[data-testid="delivery-address"]')).toBeVisible();
      await expect(firstPackage.locator('[data-testid="package-status"]')).toBeVisible();
    }
  });

  test('should show package check-off functionality', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    const packageItems = page.locator('[data-testid^="manifest-package-"]');
    if ((await packageItems.count()) > 0) {
      const firstPackage = packageItems.first();

      // Look for checkbox or check-off mechanism
      const checkbox = firstPackage.locator('[data-testid="package-checkbox"]');
      const checkoffButton = firstPackage.locator('[data-testid="mark-complete"]');
      const statusToggle = firstPackage.locator('[data-testid="status-toggle"]');

      if (await checkbox.isVisible()) {
        // Test checkbox functionality
        const isChecked = await checkbox.isChecked();
        await checkbox.click();

        await expect(checkbox).toBeChecked({ checked: !isChecked });

        // Should update package status
        const packageStatus = firstPackage.locator('[data-testid="package-status"]');
        await expect(packageStatus).toContainText(
          isChecked ? /pending|incomplete/ : /completed|delivered/
        );
      } else if (await checkoffButton.isVisible()) {
        await checkoffButton.click();

        // Should show confirmation or update status
        await expect(page.locator('[data-testid="package-marked-complete"]')).toBeVisible();
      } else if (await statusToggle.isVisible()) {
        await statusToggle.click();

        // Should change status
        await expect(firstPackage.locator('[data-testid="status-updated"]')).toBeVisible();
      }
    }
  });

  test('should display route optimization information', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Check for route optimization section
    const routeSection = page.locator('[data-testid="route-optimization"]');
    const deliveryRoute = page.locator('[data-testid="delivery-route"]');

    if (await routeSection.isVisible()) {
      await expect(routeSection).toBeVisible();

      // Check for route details
      await expect(routeSection.locator('[data-testid="total-distance"]')).toBeVisible();
      await expect(routeSection.locator('[data-testid="estimated-time"]')).toBeVisible();

      // Check for route stops
      const routeStops = routeSection.locator('[data-testid^="route-stop-"]');
      if ((await routeStops.count()) > 0) {
        const firstStop = routeStops.first();
        await expect(firstStop.locator('[data-testid="stop-address"]')).toBeVisible();
        await expect(firstStop.locator('[data-testid="stop-time"]')).toBeVisible();
      }
    }

    if (await deliveryRoute.isVisible()) {
      // Check route sequence display
      const routeItems = deliveryRoute.locator('[data-testid^="route-item-"]');
      if ((await routeItems.count()) > 1) {
        // Items should be in sequence
        for (let i = 0; i < (await routeItems.count()); i++) {
          const item = routeItems.nth(i);
          const sequenceNumber = item.locator('[data-testid="sequence-number"]');

          if (await sequenceNumber.isVisible()) {
            const sequence = await sequenceNumber.textContent();
            expect(sequence).toContain((i + 1).toString());
          }
        }
      }
    }
  });

  test('should show delivery instructions for each package', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    const packageItems = page.locator('[data-testid^="manifest-package-"]');
    if ((await packageItems.count()) > 0) {
      const firstPackage = packageItems.first();

      // Look for delivery instructions
      const instructions = firstPackage.locator('[data-testid="delivery-instructions"]');
      const instructionsButton = firstPackage.locator('[data-testid="show-instructions"]');
      const notesSection = firstPackage.locator('[data-testid="delivery-notes"]');

      if (await instructions.isVisible()) {
        await expect(instructions).toBeVisible();
        const instructionText = await instructions.textContent();
        expect(instructionText).toBeTruthy();
      } else if (await instructionsButton.isVisible()) {
        await instructionsButton.click();

        // Should show instructions modal or expand section
        const instructionModal = page.locator('[data-testid="instructions-modal"]');
        const expandedInstructions = page.locator('[data-testid="expanded-instructions"]');

        if (await instructionModal.isVisible()) {
          await expect(instructionModal.locator('[data-testid="instruction-text"]')).toBeVisible();
          await page.click('[data-testid="close-instructions"]');
        } else if (await expandedInstructions.isVisible()) {
          await expect(expandedInstructions).toBeVisible();
        }
      }

      if (await notesSection.isVisible()) {
        await expect(notesSection).toBeVisible();

        // Check for special delivery notes
        const specialNotes = notesSection.locator('[data-testid="special-notes"]');
        const accessCode = notesSection.locator('[data-testid="access-code"]');
        const contactInfo = notesSection.locator('[data-testid="contact-info"]');

        if (await specialNotes.isVisible()) {
          await expect(specialNotes).toContainText(/note|instruction|special/i);
        }

        if (await accessCode.isVisible()) {
          await expect(accessCode).toContainText(/code|access|key/i);
        }

        if (await contactInfo.isVisible()) {
          await expect(contactInfo).toContainText(/phone|contact/i);
        }
      }
    }
  });

  test('should handle manifest filtering and sorting', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Check for filter options
    const filterDropdown = page.locator('[data-testid="manifest-filter"]');
    const sortOptions = page.locator('[data-testid="manifest-sort"]');
    const searchBox = page.locator('[data-testid="manifest-search"]');

    if (await filterDropdown.isVisible()) {
      await filterDropdown.click();

      // Check filter options
      await expect(page.locator('[data-testid="filter-pending"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();

      // Test filtering
      await page.click('[data-testid="filter-pending"]');

      // Should update package list
      const packageList = page.locator('[data-testid="manifest-package-list"]');
      await expect(packageList).toBeVisible();

      // Check that only pending packages are shown
      const packageStatuses = page.locator('[data-testid="package-status"]');
      for (let i = 0; i < (await packageStatuses.count()); i++) {
        const status = packageStatuses.nth(i);
        const statusText = await status.textContent();
        expect(statusText).toMatch(/pending|not delivered|incomplete/i);
      }
    }

    if (await sortOptions.isVisible()) {
      await sortOptions.click();

      await expect(page.locator('[data-testid="sort-sequence"]')).toBeVisible();
      await expect(page.locator('[data-testid="sort-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="sort-priority"]')).toBeVisible();

      // Test sorting
      await page.click('[data-testid="sort-address"]');

      // Should re-order packages
      await expect(page.locator('[data-testid="sort-applied"]')).toBeVisible();
    }

    if (await searchBox.isVisible()) {
      await searchBox.fill('123 Main');
      await page.keyboard.press('Enter');

      // Should filter packages by search term
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

      // Clear search
      await page.click('[data-testid="clear-search"]');
      await expect(page.locator('[data-testid="all-packages"]')).toBeVisible();
    }
  });

  test('should support manifest export functionality', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Check for export options
    const exportButton = page.locator('[data-testid="export-manifest"]');
    const printButton = page.locator('[data-testid="print-manifest"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Should show export options
      const exportModal = page.locator('[data-testid="export-options-modal"]');
      await expect(exportModal).toBeVisible();

      // Check export formats
      await expect(exportModal.locator('[data-testid="export-pdf"]')).toBeVisible();
      await expect(exportModal.locator('[data-testid="export-csv"]')).toBeVisible();
      await expect(exportModal.locator('[data-testid="export-print"]')).toBeVisible();

      // Test PDF export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportModal.locator('[data-testid="export-pdf"]').click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/manifest.*\.pdf$/i);
    }

    if (await printButton.isVisible()) {
      // Test print functionality
      await printButton.click();

      // Should open print dialog or show print preview
      const printPreview = page.locator('[data-testid="print-preview"]');
      if (await printPreview.isVisible()) {
        await expect(printPreview).toBeVisible();

        // Check print preview content
        await expect(printPreview.locator('[data-testid="preview-header"]')).toBeVisible();
        await expect(printPreview.locator('[data-testid="preview-packages"]')).toBeVisible();

        await page.click('[data-testid="close-preview"]');
      }
    }
  });

  test('should handle manifest refresh and sync', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Check for refresh functionality
    const refreshButton = page.locator('[data-testid="refresh-manifest"]');
    const syncIndicator = page.locator('[data-testid="sync-status"]');

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show loading state
      await expect(page.locator('[data-testid="manifest-refreshing"]')).toBeVisible();
      await page.waitForSelector('[data-testid="manifest-refreshing"]', { state: 'hidden' });

      // Should show updated timestamp
      const lastUpdated = page.locator('[data-testid="last-updated"]');
      if (await lastUpdated.isVisible()) {
        const updateText = await lastUpdated.textContent();
        expect(updateText).toMatch(/updated|refreshed|just now/i);
      }
    }

    if (await syncIndicator.isVisible()) {
      // Check sync status
      const syncText = await syncIndicator.textContent();
      expect(syncText).toMatch(/synced|updated|connected/i);

      // Check for auto-sync toggle
      const autoSyncToggle = page.locator('[data-testid="auto-sync-toggle"]');
      if (await autoSyncToggle.isVisible()) {
        await autoSyncToggle.click();

        // Should enable/disable auto-sync
        await expect(page.locator('[data-testid="sync-preference-saved"]')).toBeVisible();
      }
    }
  });

  test('should handle offline manifest access', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Wait for manifest to load
    await expect(page.locator('[data-testid="manifest-content"]')).toBeVisible();

    // Go offline
    await page.context().setOffline(true);

    // Refresh to test offline behavior
    await page.reload();
    await page.click('[data-testid="view-manifest"]');

    // Should show cached manifest or offline indicator
    const offlineManifest = page.locator('[data-testid="offline-manifest"]');
    const cachedManifest = page.locator('[data-testid="cached-manifest"]');

    if (await offlineManifest.isVisible()) {
      await expect(offlineManifest).toContainText(/offline|cached|stored/i);
    }

    if (await cachedManifest.isVisible()) {
      await expect(cachedManifest).toBeVisible();

      // Cached manifest should still show packages
      await expect(cachedManifest.locator('[data-testid^="manifest-package-"]')).toHaveCount({
        min: 1,
      });

      // Should show cache timestamp
      const cacheTime = cachedManifest.locator('[data-testid="cache-timestamp"]');
      if (await cacheTime.isVisible()) {
        await expect(cacheTime).toContainText(/cached|stored/i);
      }
    }

    // Go back online
    await page.context().setOffline(false);

    // Should sync when back online
    await page.waitForTimeout(1000);
    const syncIndicator = page.locator('[data-testid="syncing-manifest"]');
    if (await syncIndicator.isVisible()) {
      await expect(syncIndicator).toContainText(/syncing|updating/i);
    }
  });

  test('should show delivery progress tracking', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Check for progress indicators
    const progressBar = page.locator('[data-testid="delivery-progress-bar"]');
    const progressStats = page.locator('[data-testid="progress-stats"]');
    const progressSummary = page.locator('[data-testid="delivery-summary"]');

    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();

      // Should show completion percentage
      const percentage = progressBar.locator('[data-testid="progress-percentage"]');
      if (await percentage.isVisible()) {
        const percentText = await percentage.textContent();
        expect(percentText).toMatch(/\d+%/);
      }
    }

    if (await progressStats.isVisible()) {
      // Should show delivery statistics
      await expect(progressStats.locator('[data-testid="completed-count"]')).toBeVisible();
      await expect(progressStats.locator('[data-testid="pending-count"]')).toBeVisible();
      await expect(progressStats.locator('[data-testid="total-count"]')).toBeVisible();

      // Numbers should be consistent
      const completedText = await progressStats
        .locator('[data-testid="completed-count"]')
        .textContent();
      const pendingText = await progressStats
        .locator('[data-testid="pending-count"]')
        .textContent();
      const totalText = await progressStats.locator('[data-testid="total-count"]').textContent();

      const completed = parseInt(completedText?.match(/\d+/)?.[0] || '0');
      const pending = parseInt(pendingText?.match(/\d+/)?.[0] || '0');
      const total = parseInt(totalText?.match(/\d+/)?.[0] || '0');

      expect(completed + pending).toBeLessThanOrEqual(total);
    }

    if (await progressSummary.isVisible()) {
      // Should show overall delivery status
      await expect(progressSummary).toContainText(/progress|status|delivery/i);

      // Check for ETA or time estimates
      const etaElement = progressSummary.locator('[data-testid="estimated-completion"]');
      if (await etaElement.isVisible()) {
        const etaText = await etaElement.textContent();
        expect(etaText).toMatch(/eta|estimate|time|hour|minute/i);
      }
    }
  });

  test('should handle package priority and special requirements', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    const packageItems = page.locator('[data-testid^="manifest-package-"]');

    if ((await packageItems.count()) > 0) {
      // Look for priority indicators
      const priorityPackages = page.locator('[data-testid^="priority-"]');
      const urgentPackages = page.locator('[data-testid^="urgent-"]');
      const specialRequirements = page.locator('[data-testid^="special-req-"]');

      if ((await priorityPackages.count()) > 0) {
        const firstPriority = priorityPackages.first();
        await expect(firstPriority).toBeVisible();

        // Should have visual indicator
        const priorityBadge = firstPriority.locator('[data-testid="priority-badge"]');
        const priorityIcon = firstPriority.locator('[data-testid="priority-icon"]');

        if (await priorityBadge.isVisible()) {
          await expect(priorityBadge).toContainText(/high|urgent|priority/i);
        }

        if (await priorityIcon.isVisible()) {
          await expect(priorityIcon).toBeVisible();
        }
      }

      if ((await specialRequirements.count()) > 0) {
        const firstSpecial = specialRequirements.first();

        // Check for special requirement types
        const signatureRequired = firstSpecial.locator('[data-testid="signature-required"]');
        const ageVerification = firstSpecial.locator('[data-testid="age-verification"]');
        const fragileItem = firstSpecial.locator('[data-testid="fragile-item"]');

        if (await signatureRequired.isVisible()) {
          await expect(signatureRequired).toContainText(/signature|sign/i);
        }

        if (await ageVerification.isVisible()) {
          await expect(ageVerification).toContainText(/age|verify|id/i);
        }

        if (await fragileItem.isVisible()) {
          await expect(fragileItem).toContainText(/fragile|handle.*care/i);
        }
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/driver');
    await page.click('[data-testid="view-manifest"]');

    // Manifest should adapt to mobile layout
    const manifest = page.locator('[data-testid="manifest-display"]');
    await expect(manifest).toBeVisible();

    // Package items should stack vertically
    const packageItems = page.locator('[data-testid^="manifest-package-"]');

    if ((await packageItems.count()) > 1) {
      const firstItem = packageItems.first();
      const secondItem = packageItems.nth(1);

      const firstBox = await firstItem.boundingBox();
      const secondBox = await secondItem.boundingBox();

      if (firstBox && secondBox) {
        // Second item should be below first (mobile stacking)
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
      }
    }

    // Check mobile-specific controls
    const mobileFilters = page.locator('[data-testid="mobile-manifest-filters"]');
    if (await mobileFilters.isVisible()) {
      await expect(mobileFilters).toBeVisible();
    }

    // Test swipe functionality if available
    const swipeableItems = page.locator('[data-testid="swipeable-package"]');
    if ((await swipeableItems.count()) > 0) {
      const firstSwipeable = swipeableItems.first();
      const itemBox = await firstSwipeable.boundingBox();

      if (itemBox) {
        // Simulate swipe left
        await page.mouse.move(itemBox.x + itemBox.width - 50, itemBox.y + itemBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(itemBox.x + 50, itemBox.y + itemBox.height / 2);
        await page.mouse.up();

        // Should reveal swipe actions
        const swipeActions = page.locator('[data-testid="package-swipe-actions"]');
        if (await swipeActions.isVisible()) {
          await expect(swipeActions.locator('[data-testid="quick-complete"]')).toBeVisible();
        }
      }
    }
  });
});
