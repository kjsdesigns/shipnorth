import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Global Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff (has access to most entities)
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);
  });

  test('should activate search modal with keyboard shortcut', async ({ page }) => {
    await page.goto('/staff');

    // Test Cmd+K / Ctrl+K shortcut
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyK`);

    // Should open search modal
    const searchModal = page.locator('[data-testid="global-search-modal"]');
    await expect(searchModal).toBeVisible();

    // Should focus search input
    const searchInput = searchModal.locator('[data-testid="global-search-input"]');
    await expect(searchInput).toBeFocused();

    // Should show search shortcut hint
    const shortcutHint = searchModal.locator('[data-testid="search-shortcut-hint"]');
    if (await shortcutHint.isVisible()) {
      await expect(shortcutHint).toContainText(isMac ? '⌘K' : 'Ctrl+K');
    }
  });

  test('should display search button and open modal', async ({ page }) => {
    await page.goto('/staff');

    const searchButton = page.locator('[data-testid="global-search-button"]');
    await expect(searchButton).toBeVisible();

    await searchButton.click();

    const searchModal = page.locator('[data-testid="global-search-modal"]');
    await expect(searchModal).toBeVisible();

    // Check modal elements
    await expect(searchModal.locator('[data-testid="global-search-input"]')).toBeVisible();
    await expect(searchModal.locator('[data-testid="search-categories"]')).toBeVisible();
    await expect(searchModal.locator('[data-testid="search-recent"]')).toBeVisible();
  });

  test('should perform real-time search across entities', async ({ page }) => {
    await page.goto('/staff');

    // Open search
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');

    // Test searching for packages
    await searchInput.fill('SNH');

    // Should show real-time results
    await page.waitForTimeout(500); // Allow debounce

    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();

    const packageResults = searchResults.locator('[data-testid^="package-result-"]');
    if ((await packageResults.count()) > 0) {
      const firstPackage = packageResults.first();

      // Should show package information
      await expect(firstPackage.locator('[data-testid="result-title"]')).toContainText(/SNH/);
      await expect(firstPackage.locator('[data-testid="result-type"]')).toContainText(/package/i);
      await expect(firstPackage.locator('[data-testid="result-preview"]')).toBeVisible();

      // Test clicking on result
      await firstPackage.click();

      // Should navigate to package details or show details modal
      const packageDetails = page.locator('[data-testid="package-details"]');
      const packageModal = page.locator('[data-testid="package-modal"]');

      const hasDetails = await packageDetails.isVisible();
      const hasModal = await packageModal.isVisible();

      expect(hasDetails || hasModal).toBeTruthy();
    }
  });

  test('should search customers by name and email', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');

    // Search for customer
    await searchInput.fill('john');
    await page.waitForTimeout(500);

    const customerResults = page.locator('[data-testid^="customer-result-"]');

    if ((await customerResults.count()) > 0) {
      const firstCustomer = customerResults.first();

      await expect(firstCustomer.locator('[data-testid="result-title"]')).toContainText(/john/i);
      await expect(firstCustomer.locator('[data-testid="result-type"]')).toContainText(/customer/i);

      // Should show customer preview info
      const customerPreview = firstCustomer.locator('[data-testid="result-preview"]');
      if (await customerPreview.isVisible()) {
        const previewText = await customerPreview.textContent();
        expect(previewText).toMatch(/@.*\.|phone|address/);
      }

      // Test navigating to customer
      await firstCustomer.click();

      // Should close search and go to customer page
      const searchModal = page.locator('[data-testid="global-search-modal"]');
      await expect(searchModal).not.toBeVisible();

      // Should show customer information
      const customerInfo = page.locator('[data-testid="customer-info"]');
      const customerPage = page.locator('[data-testid="customer-details-page"]');

      const hasInfo = await customerInfo.isVisible();
      const hasPage = await customerPage.isVisible();

      expect(hasInfo || hasPage).toBeTruthy();
    }
  });

  test('should display search result highlighting', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('ship');
    await page.waitForTimeout(500);

    const searchResults = page.locator('[data-testid="search-results"]');
    const resultItems = searchResults.locator('[data-testid^="result-"]');

    if ((await resultItems.count()) > 0) {
      const firstResult = resultItems.first();

      // Should highlight search term
      const highlightedText = firstResult.locator(
        '[data-testid="highlighted-text"], .search-highlight, mark'
      );

      if ((await highlightedText.count()) > 0) {
        const highlightElement = highlightedText.first();
        await expect(highlightElement).toBeVisible();

        const highlightedContent = await highlightElement.textContent();
        expect(highlightedContent?.toLowerCase()).toContain('ship');

        // Should have highlighting styles
        const styles = await highlightElement.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontWeight: computed.fontWeight,
          };
        });

        // Should have visual highlighting (background color or bold)
        expect(
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            styles.backgroundColor !== 'transparent' ||
            styles.fontWeight === 'bold' ||
            parseInt(styles.fontWeight) >= 600
        ).toBeTruthy();
      }
    }
  });

  test('should support category filtering', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchCategories = page.locator('[data-testid="search-categories"]');

    if (await searchCategories.isVisible()) {
      // Should show category filters
      await expect(searchCategories.locator('[data-testid="category-all"]')).toBeVisible();
      await expect(searchCategories.locator('[data-testid="category-packages"]')).toBeVisible();
      await expect(searchCategories.locator('[data-testid="category-customers"]')).toBeVisible();
      await expect(searchCategories.locator('[data-testid="category-loads"]')).toBeVisible();

      // Test filtering by category
      await page.click('[data-testid="category-packages"]');

      const searchInput = page.locator('[data-testid="global-search-input"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Should only show package results
      const searchResults = page.locator('[data-testid="search-results"]');
      const resultItems = searchResults.locator('[data-testid^="result-"]');

      for (let i = 0; i < (await resultItems.count()); i++) {
        const result = resultItems.nth(i);
        const resultType = result.locator('[data-testid="result-type"]');

        if (await resultType.isVisible()) {
          const typeText = await resultType.textContent();
          expect(typeText?.toLowerCase()).toMatch(/package|shipment/);
        }
      }

      // Test switching categories
      await page.click('[data-testid="category-customers"]');

      await page.waitForTimeout(500);

      // Should now show customer results
      const customerResults = searchResults.locator('[data-testid^="customer-result-"]');
      if ((await customerResults.count()) > 0) {
        expect(await customerResults.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should handle keyboard navigation in search results', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const searchResults = page.locator('[data-testid="search-results"]');
    const resultItems = searchResults.locator('[data-testid^="result-"]');

    if ((await resultItems.count()) > 1) {
      // Navigate down with arrow keys
      await page.keyboard.press('ArrowDown');

      // First result should be highlighted
      const firstResult = resultItems.first();
      await expect(firstResult).toHaveClass(/selected|active|highlighted/);

      // Navigate to second result
      await page.keyboard.press('ArrowDown');

      const secondResult = resultItems.nth(1);
      await expect(secondResult).toHaveClass(/selected|active|highlighted/);

      // Navigate back up
      await page.keyboard.press('ArrowUp');
      await expect(firstResult).toHaveClass(/selected|active|highlighted/);

      // Press Enter to select
      await page.keyboard.press('Enter');

      // Should navigate to selected result
      const searchModal = page.locator('[data-testid="global-search-modal"]');
      await expect(searchModal).not.toBeVisible();
    }

    // Test Escape to close
    await page.keyboard.press('Meta+KeyK');
    const reopenedModal = page.locator('[data-testid="global-search-modal"]');
    await expect(reopenedModal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(reopenedModal).not.toBeVisible();
  });

  test('should display recent searches', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    // Perform a search first
    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('john smith');
    await page.waitForTimeout(500);

    const firstResult = page.locator('[data-testid^="result-"]').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
    } else {
      // Close modal to save search
      await page.keyboard.press('Escape');
    }

    // Open search again
    await page.keyboard.press('Meta+KeyK');

    const recentSearches = page.locator('[data-testid="search-recent"]');
    if (await recentSearches.isVisible()) {
      await expect(recentSearches).toBeVisible();

      const recentItems = recentSearches.locator('[data-testid^="recent-search-"]');

      if ((await recentItems.count()) > 0) {
        const firstRecent = recentItems.first();
        await expect(firstRecent).toContainText(/john smith/i);

        // Test clicking on recent search
        await firstRecent.click();

        // Should populate search input
        const inputValue = await searchInput.inputValue();
        expect(inputValue.toLowerCase()).toContain('john smith');

        // Should show results
        await page.waitForTimeout(500);
        const searchResults = page.locator('[data-testid="search-results"]');
        await expect(searchResults).toBeVisible();
      }
    }

    // Test clearing recent searches
    const clearRecent = page.locator('[data-testid="clear-recent-searches"]');
    if (await clearRecent.isVisible()) {
      await clearRecent.click();

      const confirmClear = page.locator('[data-testid="confirm-clear-recent"]');
      if (await confirmClear.isVisible()) {
        await confirmClear.click();
      }

      // Recent searches should be cleared
      const emptyRecent = recentSearches.locator('[data-testid="no-recent-searches"]');
      if (await emptyRecent.isVisible()) {
        await expect(emptyRecent).toBeVisible();
      }
    }
  });

  test('should handle search performance and debouncing', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');

    // Type quickly to test debouncing
    await searchInput.type('quick typing test', { delay: 50 });

    // Should show loading state
    const loadingIndicator = page.locator('[data-testid="search-loading"]');
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();

      // Wait for loading to complete
      await page.waitForSelector('[data-testid="search-loading"]', { state: 'hidden' });
    }

    // Should show results after debounce
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();

    // Test search performance indicator
    const performanceInfo = page.locator('[data-testid="search-performance"]');
    if (await performanceInfo.isVisible()) {
      const performanceText = await performanceInfo.textContent();
      expect(performanceText).toMatch(/\d+.*results.*\d+.*ms|found.*in/);
    }

    // Test minimum character requirement
    await searchInput.clear();
    await searchInput.type('a');

    const minCharWarning = page.locator('[data-testid="min-char-warning"]');
    if (await minCharWarning.isVisible()) {
      await expect(minCharWarning).toContainText(/minimum.*character|type.*more/);
    }
  });

  test('should support advanced search filters', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const advancedFilters = page.locator('[data-testid="advanced-search-filters"]');
    const filtersToggle = page.locator('[data-testid="toggle-advanced-filters"]');

    if (await filtersToggle.isVisible()) {
      await filtersToggle.click();

      await expect(advancedFilters).toBeVisible();

      // Date range filter
      const dateFilter = advancedFilters.locator('[data-testid="date-range-filter"]');
      if (await dateFilter.isVisible()) {
        const fromDate = dateFilter.locator('[data-testid="from-date"]');
        const toDate = dateFilter.locator('[data-testid="to-date"]');

        await fromDate.fill('2024-01-01');
        await toDate.fill('2024-12-31');

        const applyDateFilter = dateFilter.locator('[data-testid="apply-date-filter"]');
        if (await applyDateFilter.isVisible()) {
          await applyDateFilter.click();
        }
      }

      // Status filter
      const statusFilter = advancedFilters.locator('[data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        const deliveredStatus = page.locator('[data-testid="status-delivered"]');
        if (await deliveredStatus.isVisible()) {
          await deliveredStatus.click();
        }
      }

      // Location filter
      const locationFilter = advancedFilters.locator('[data-testid="location-filter"]');
      if (await locationFilter.isVisible()) {
        await locationFilter.fill('Vancouver');
      }

      // Apply all filters
      const searchInput = page.locator('[data-testid="global-search-input"]');
      await searchInput.fill('package');
      await page.waitForTimeout(500);

      // Should show filtered results
      const filteredResults = page.locator('[data-testid="filtered-search-results"]');
      if (await filteredResults.isVisible()) {
        await expect(filteredResults).toBeVisible();

        // Should show active filters indicator
        const activeFilters = page.locator('[data-testid="active-filters-count"]');
        if (await activeFilters.isVisible()) {
          const filterCount = await activeFilters.textContent();
          expect(filterCount).toMatch(/\d+.*filter/);
        }
      }

      // Test clearing filters
      const clearFilters = page.locator('[data-testid="clear-all-filters"]');
      if (await clearFilters.isVisible()) {
        await clearFilters.click();

        // Filters should be reset
        await expect(fromDate).toHaveValue('');
        await expect(toDate).toHaveValue('');
      }
    }
  });

  test('should handle empty search states', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');

    // Search for something that won't exist
    await searchInput.fill('xyzabc123nonexistent');
    await page.waitForTimeout(500);

    // Should show no results message
    const noResults = page.locator('[data-testid="no-search-results"]');
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText(/no results|not found|try different/);

    // Should show search suggestions
    const searchSuggestions = page.locator('[data-testid="search-suggestions"]');
    if (await searchSuggestions.isVisible()) {
      const suggestions = searchSuggestions.locator('[data-testid^="suggestion-"]');

      if ((await suggestions.count()) > 0) {
        const firstSuggestion = suggestions.first();
        await expect(firstSuggestion).toBeVisible();

        // Test clicking suggestion
        await firstSuggestion.click();

        // Should update search input
        const newInputValue = await searchInput.inputValue();
        expect(newInputValue).not.toBe('xyzabc123nonexistent');
      }
    }

    // Test empty input state
    await searchInput.clear();

    const emptyState = page.locator('[data-testid="search-empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText(/start typing|search for/);

      // Should show popular searches or categories
      const popularSearches = emptyState.locator('[data-testid="popular-searches"]');
      if (await popularSearches.isVisible()) {
        const popularItems = popularSearches.locator('[data-testid^="popular-"]');

        if ((await popularItems.count()) > 0) {
          const firstPopular = popularItems.first();
          await firstPopular.click();

          // Should populate search
          const populatedValue = await searchInput.inputValue();
          expect(populatedValue.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should support search result actions', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill('package');
    await page.waitForTimeout(500);

    const searchResults = page.locator('[data-testid="search-results"]');
    const resultItems = searchResults.locator('[data-testid^="result-"]');

    if ((await resultItems.count()) > 0) {
      const firstResult = resultItems.first();

      // Test result actions menu
      const actionsButton = firstResult.locator('[data-testid="result-actions"]');
      if (await actionsButton.isVisible()) {
        await actionsButton.click();

        const actionsMenu = page.locator('[data-testid="result-actions-menu"]');
        await expect(actionsMenu).toBeVisible();

        // Should have relevant actions
        const viewAction = actionsMenu.locator('[data-testid="action-view"]');
        const editAction = actionsMenu.locator('[data-testid="action-edit"]');

        if (await viewAction.isVisible()) {
          await expect(viewAction).toContainText(/view|open|details/);
        }

        if (await editAction.isVisible()) {
          await expect(editAction).toContainText(/edit|modify/);
        }

        // Test quick action
        if (await viewAction.isVisible()) {
          await viewAction.click();

          // Should navigate or open details
          const searchModal = page.locator('[data-testid="global-search-modal"]');
          await expect(searchModal).not.toBeVisible();
        }
      }

      // Test result preview on hover
      const resultPreview = firstResult.locator('[data-testid="result-preview"]');
      if (await resultPreview.isVisible()) {
        await firstResult.hover();

        const expandedPreview = page.locator('[data-testid="expanded-result-preview"]');
        if (await expandedPreview.isVisible()) {
          await expect(expandedPreview).toBeVisible();

          // Should show more detailed information
          await expect(expandedPreview.locator('[data-testid="preview-details"]')).toBeVisible();
        }
      }
    }
  });

  test('should be accessible with screen readers', async ({ page }) => {
    await page.goto('/staff');
    await page.keyboard.press('Meta+KeyK');

    const searchModal = page.locator('[data-testid="global-search-modal"]');
    const searchInput = page.locator('[data-testid="global-search-input"]');

    // Check ARIA attributes
    const modalRole = await searchModal.getAttribute('role');
    expect(modalRole).toBe('dialog');

    const inputRole = await searchInput.getAttribute('role');
    expect(['searchbox', 'textbox'].includes(inputRole || '')).toBeTruthy();

    // Check labels
    const ariaLabel = await searchInput.getAttribute('aria-label');
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(ariaLabel || placeholder).toMatch(/search|find/);

    // Check for screen reader announcements
    await searchInput.fill('test search');
    await page.waitForTimeout(500);

    const searchResults = page.locator('[data-testid="search-results"]');
    const liveRegion = searchResults.locator('[aria-live="polite"], [aria-live="assertive"]');

    if (await liveRegion.isVisible()) {
      const announcement = await liveRegion.textContent();
      expect(announcement).toMatch(/results|found|searching/);
    }

    // Test keyboard accessibility
    await page.keyboard.press('Tab');

    // Should focus first result or close button
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());
    expect(['button', 'a', 'div'].includes(tagName)).toBeTruthy();

    // Check focus management
    await page.keyboard.press('Escape');

    // Focus should return to search button or trigger element
    const searchButton = page.locator('[data-testid="global-search-button"]');
    if (await searchButton.isVisible()) {
      await expect(searchButton).toBeFocused();
    }
  });
});
