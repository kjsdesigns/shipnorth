import { expect, Page, Locator } from '@playwright/test';

/**
 * Custom assertions and matchers for Playwright tests
 * Provides reusable assertion patterns to reduce duplication
 */

export class CustomAssertions {
  constructor(private page: Page) {}

  /**
   * Assert that a form has proper validation
   */
  async expectFormValidation(form: Locator, requiredFields: string[]) {
    for (const fieldSelector of requiredFields) {
      const field = form.locator(fieldSelector);
      await expect(field).toHaveAttribute('required');
    }
  }

  /**
   * Assert that email validation works properly
   */
  async expectEmailValidation(emailInput: Locator, invalidEmails: string[]) {
    for (const email of invalidEmails) {
      await emailInput.fill(email);
      const validity = await emailInput.evaluate((input: HTMLInputElement) => input.validity.valid);
      expect(validity).toBe(false);
    }
  }

  /**
   * Assert that a table has the expected structure
   */
  async expectTableStructure(table: Locator, expectedHeaders: string[]) {
    await expect(table).toBeVisible();

    for (const header of expectedHeaders) {
      await expect(table.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  }

  /**
   * Assert that a table has data or shows empty state
   */
  async expectTableDataOrEmptyState(table: Locator) {
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      // Should show empty state message
      await expect(this.page.locator('text=No data, text=empty, text=found')).toBeVisible();
    } else {
      // Should have data in first row
      await expect(rows.first().locator('td').first()).toBeVisible();
    }
  }

  /**
   * Assert that pagination controls work properly
   */
  async expectPaginationControls(container: Locator) {
    const paginationContainer = container.locator('[data-testid="pagination"], .pagination');

    if (await paginationContainer.isVisible()) {
      // Should have previous/next buttons
      await expect(
        paginationContainer.locator(
          'button:has-text("Previous"), button:has([data-lucide="chevron-left"])'
        )
      ).toBeVisible();
      await expect(
        paginationContainer.locator(
          'button:has-text("Next"), button:has([data-lucide="chevron-right"])'
        )
      ).toBeVisible();

      // Should have page numbers or current page indicator
      await expect(paginationContainer.locator('text=/Page \\d+|\\d+ of \\d+/')).toBeVisible();
    }
  }

  /**
   * Assert that responsive design works on different viewports
   */
  async expectResponsiveDesign(
    viewports: { width: number; height: number; name: string }[],
    elements: Locator[]
  ) {
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500);

      for (const element of elements) {
        await expect(element).toBeVisible();
      }

      // Take screenshot for visual verification
      await this.page.screenshot({
        path: `test-results/responsive-${viewport.name}.png`,
        fullPage: true,
      });
    }
  }

  /**
   * Assert that loading states are shown during async operations
   */
  async expectLoadingState(triggerElement: Locator, loadingIndicator?: string) {
    await triggerElement.click();

    if (loadingIndicator) {
      await expect(this.page.locator(loadingIndicator)).toBeVisible({ timeout: 1000 });
    } else {
      // Look for common loading indicators
      await expect(
        this.page
          .locator('button:disabled, [data-testid="loading"], .spinner, .loading, text=Loading')
          .first()
      ).toBeVisible({ timeout: 1000 });
    }
  }

  /**
   * Assert that error states are handled properly
   */
  async expectErrorHandling(errorTrigger: () => Promise<void>, expectedErrorMessage?: string) {
    await errorTrigger();

    if (expectedErrorMessage) {
      await expect(this.page.locator(`text=${expectedErrorMessage}`)).toBeVisible();
    } else {
      // Look for common error indicators
      await expect(
        this.page.locator('[role="alert"], .error, .alert-error, text=Error, text=Failed').first()
      ).toBeVisible();
    }
  }

  /**
   * Assert that theme switching works properly
   */
  async expectThemeToggle(themeToggle: Locator) {
    const html = this.page.locator('html');

    // Get initial theme state
    const initialClass = (await html.getAttribute('class')) || '';
    const isDarkInitially = initialClass.includes('dark');

    // Click theme toggle
    await themeToggle.click();
    await this.page.waitForTimeout(500);

    // Verify theme changed
    const newClass = (await html.getAttribute('class')) || '';
    const isDarkAfterToggle = newClass.includes('dark');

    expect(isDarkAfterToggle).toBe(!isDarkInitially);

    // Toggle back and verify
    await themeToggle.click();
    await this.page.waitForTimeout(500);

    const finalClass = (await html.getAttribute('class')) || '';
    const isDarkFinal = finalClass.includes('dark');

    expect(isDarkFinal).toBe(isDarkInitially);
  }

  /**
   * Assert that keyboard navigation works properly
   */
  async expectKeyboardNavigation(elements: Locator[]) {
    // Start from first element
    await elements[0].focus();
    await expect(elements[0]).toBeFocused();

    // Tab through elements
    for (let i = 1; i < elements.length; i++) {
      await this.page.keyboard.press('Tab');
      await expect(elements[i]).toBeFocused();
    }
  }

  /**
   * Assert that search functionality works
   */
  async expectSearchFunctionality(
    searchInput: Locator,
    searchButton: Locator,
    resultsContainer: Locator,
    searchTerm: string
  ) {
    await searchInput.fill(searchTerm);
    await searchButton.click();

    // Should show results or "no results" message
    await expect(resultsContainer).toBeVisible();

    // Results should contain search term or show "no results"
    const hasResults = (await resultsContainer.locator(`text=${searchTerm}`).count()) > 0;
    const hasNoResults =
      (await resultsContainer.locator('text=No results, text=not found').count()) > 0;

    expect(hasResults || hasNoResults).toBe(true);
  }

  /**
   * Assert that file upload works properly
   */
  async expectFileUpload(fileInput: Locator, filePath: string, expectedFeedback?: string) {
    await fileInput.setInputFiles(filePath);

    if (expectedFeedback) {
      await expect(this.page.locator(`text=${expectedFeedback}`)).toBeVisible();
    } else {
      // Look for common upload success indicators
      await expect(
        this.page.locator('text=Uploaded, text=Success, [data-testid="upload-success"]').first()
      ).toBeVisible();
    }
  }

  /**
   * Assert that GPS/location features work
   */
  async expectLocationFeatures(locationButton: Locator) {
    await locationButton.click();

    // Should show location permission request or coordinates
    const hasPermissionRequest = (await this.page.locator('text=location permission').count()) > 0;
    const hasCoordinates = (await this.page.locator('text=/\\d+\\.\\d+.*\\d+\\.\\d+/').count()) > 0;
    const hasLocationError =
      (await this.page.locator('text=location unavailable, text=GPS error').count()) > 0;

    expect(hasPermissionRequest || hasCoordinates || hasLocationError).toBe(true);
  }

  /**
   * Assert that performance is within acceptable limits
   */
  async expectPerformance(operation: () => Promise<void>, maxTimeMs: number) {
    const startTime = Date.now();
    await operation();
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(maxTimeMs);

    console.log(`Operation completed in ${duration}ms (limit: ${maxTimeMs}ms)`);
  }

  /**
   * Assert that data exports work properly
   */
  async expectDataExport(exportButton: Locator, expectedFormat: 'csv' | 'xlsx' | 'pdf' = 'csv') {
    // Set up download promise before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    expect(filename).toMatch(new RegExp(`\\.${expectedFormat}$`));

    // Save the download for verification
    await download.saveAs(`test-results/${filename}`);
  }

  /**
   * Assert that modal dialogs work properly
   */
  async expectModalDialog(triggerElement: Locator, modalSelector: string = '[role="dialog"]') {
    // Modal should not be visible initially
    await expect(this.page.locator(modalSelector)).not.toBeVisible();

    // Click trigger to open modal
    await triggerElement.click();
    await expect(this.page.locator(modalSelector)).toBeVisible();

    // Should have close button or escape key functionality
    const closeButton = this.page.locator(
      `${modalSelector} button:has-text("Close"), ${modalSelector} button:has([data-lucide="x"])`
    );

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(this.page.locator(modalSelector)).not.toBeVisible();
    } else {
      // Try escape key
      await this.page.keyboard.press('Escape');
      await expect(this.page.locator(modalSelector)).not.toBeVisible();
    }
  }
}
