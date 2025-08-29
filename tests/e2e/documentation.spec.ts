import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { DocumentationPage } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';

/**
 * Documentation Site - Comprehensive Test Suite
 *
 * Consolidates:
 * - comprehensive-docs.spec.ts
 * - documentation.spec.ts
 * - global-search.spec.ts
 * - comprehensive-global-search.spec.ts
 *
 * Coverage:
 * - Documentation site navigation and structure
 * - Content accessibility and readability
 * - Global search functionality
 * - API documentation and interactive examples
 * - Mobile responsiveness
 * - Performance and SEO optimization
 * - Content versioning and updates
 * - Error handling and 404 pages
 */

test.describe('Documentation Site', () => {
  let authHelpers: AuthHelpers;
  let docsPage: DocumentationPage;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    docsPage = new DocumentationPage(page);
    assertions = new CustomAssertions(page);

    // Navigate to documentation site
    await page.goto('/docs');
    await docsPage.waitForDocsToLoad();
  });

  test.describe('Documentation Navigation and Structure', () => {
    test('should display documentation homepage @smoke', async () => {
      await expect(docsPage.docsTitle).toBeVisible();
      await expect(docsPage.navigationMenu).toBeVisible();
      await expect(docsPage.searchBox).toBeVisible();
      await expect(docsPage.tableOfContents).toBeVisible();

      // Verify main documentation sections
      await expect(docsPage.gettingStartedSection).toBeVisible();
      await expect(docsPage.apiReferenceSection).toBeVisible();
      await expect(docsPage.userGuidesSection).toBeVisible();
      await expect(docsPage.developersSection).toBeVisible();
    });

    test('should navigate through documentation sections', async () => {
      const sections = [
        { link: docsPage.gettingStartedLink, content: docsPage.gettingStartedContent },
        { link: docsPage.apiReferenceLink, content: docsPage.apiReferenceContent },
        { link: docsPage.userGuidesLink, content: docsPage.userGuidesContent },
        { link: docsPage.troubleshootingLink, content: docsPage.troubleshootingContent },
      ];

      for (const section of sections) {
        await section.link.click();
        await expect(section.content).toBeVisible();
        await assertions.checkPerformanceMetrics(2000);

        // Verify URL updates correctly
        await expect(docsPage.page).toHaveURL(/\/docs\/.+/);
      }
    });

    test('should display proper breadcrumb navigation', async () => {
      // Navigate to a nested documentation page
      await docsPage.apiReferenceLink.click();
      await docsPage.packagesApiLink.click();
      await docsPage.createPackageEndpointLink.click();

      // Verify breadcrumb trail
      await expect(docsPage.breadcrumbTrail).toBeVisible();
      await expect(docsPage.breadcrumbTrail).toContainText('Docs');
      await expect(docsPage.breadcrumbTrail).toContainText('API Reference');
      await expect(docsPage.breadcrumbTrail).toContainText('Packages');
      await expect(docsPage.breadcrumbTrail).toContainText('Create Package');

      // Test breadcrumb navigation
      await docsPage.breadcrumbTrail.locator('a:has-text("API Reference")').click();
      await expect(docsPage.apiReferenceContent).toBeVisible();
    });

    test('should maintain sidebar navigation state', async () => {
      // Expand API Reference section
      await docsPage.apiReferenceSidebarToggle.click();
      await expect(docsPage.apiReferenceSidebarSubmenu).toBeVisible();

      // Navigate to different page
      await docsPage.packagesApiLink.click();

      // Sidebar state should be maintained
      await expect(docsPage.apiReferenceSidebarSubmenu).toBeVisible();
      await expect(docsPage.packagesApiLink).toHaveClass(/active|selected/);
    });

    test('should provide table of contents for long pages', async () => {
      // Navigate to a long documentation page
      await docsPage.userGuidesLink.click();
      await docsPage.staffGuideLink.click();

      // Verify table of contents is present
      await expect(docsPage.pageTableOfContents).toBeVisible();
      await expect(docsPage.tocHeadings).toHaveCount.greaterThan(3);

      // Test TOC navigation
      const firstHeading = docsPage.tocHeadings.first();
      const headingText = await firstHeading.textContent();
      await firstHeading.click();

      // Should scroll to the corresponding section
      const targetHeading = docsPage.contentArea.locator(`h2:has-text("${headingText}")`);
      await expect(targetHeading).toBeInViewport();
    });
  });

  test.describe('Content Accessibility and Readability', () => {
    test('should meet accessibility standards @accessibility', async () => {
      // Test keyboard navigation
      await docsPage.searchBox.focus();
      await docsPage.page.keyboard.press('Tab');
      await expect(docsPage.navigationMenu.locator('a').first()).toBeFocused();

      // Test skip links
      await docsPage.page.keyboard.press('Tab');
      if (await docsPage.skipToContentLink.isVisible()) {
        await docsPage.skipToContentLink.click();
        await expect(docsPage.mainContent).toBeFocused();
      }

      // Test heading hierarchy
      const headings = await docsPage.contentArea.locator('h1, h2, h3, h4, h5, h6').all();
      let previousLevel = 0;

      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName.charAt(1));

        // Heading levels should not skip more than one level
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = currentLevel;
      }

      // Test image alt text
      const images = await docsPage.contentArea.locator('img').all();
      for (const image of images) {
        await expect(image).toHaveAttribute('alt');
      }
    });

    test('should provide proper ARIA labels and roles @accessibility', async () => {
      // Verify navigation has proper ARIA labels
      await expect(docsPage.navigationMenu).toHaveAttribute('role', 'navigation');
      await expect(docsPage.navigationMenu).toHaveAttribute('aria-label');

      // Verify search has proper labeling
      await expect(docsPage.searchBox).toHaveAttribute('aria-label');

      // Verify collapsible sections have proper ARIA attributes
      await expect(docsPage.apiReferenceSidebarToggle).toHaveAttribute('aria-expanded');
      await docsPage.apiReferenceSidebarToggle.click();
      await expect(docsPage.apiReferenceSidebarToggle).toHaveAttribute('aria-expanded', 'true');
    });

    test('should support screen reader navigation', async () => {
      // Test landmark regions
      await expect(docsPage.headerLandmark).toHaveAttribute('role', 'banner');
      await expect(docsPage.navigationLandmark).toHaveAttribute('role', 'navigation');
      await expect(docsPage.mainLandmark).toHaveAttribute('role', 'main');
      await expect(docsPage.footerLandmark).toHaveAttribute('role', 'contentinfo');

      // Test skip navigation
      await assertions.testSkipNavigation(docsPage.page);

      // Test focus management
      await assertions.testFocusManagement(docsPage.page);
    });

    test('should have readable typography and contrast @accessibility', async () => {
      // Test text contrast ratios
      await assertions.checkColorContrast(docsPage.page);

      // Test font sizes are readable
      const bodyText = docsPage.contentArea.locator('p').first();
      const fontSize = await bodyText.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum readable font size

      // Test line height for readability
      const lineHeight = await bodyText.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).lineHeight);
      });

      expect(lineHeight).toBeGreaterThanOrEqual(fontSize * 1.4); // 1.4x line height minimum
    });
  });

  test.describe('Global Search Functionality', () => {
    test('should perform basic content search @search', async () => {
      await docsPage.searchBox.click();
      await docsPage.searchBox.fill('package tracking');

      // Search should trigger automatically or on Enter
      await docsPage.page.keyboard.press('Enter');

      await expect(docsPage.searchResults).toBeVisible({ timeout: 5000 });
      await expect(docsPage.searchResultItems).toHaveCount.greaterThan(0);

      // Verify search results are relevant
      const firstResult = docsPage.searchResultItems.first();
      await expect(firstResult).toContainText(/package|tracking/i);

      // Test result navigation
      await firstResult.click();
      await expect(docsPage.contentArea).toContainText(/package|tracking/i);
    });

    test('should provide search suggestions and autocomplete @search', async () => {
      await docsPage.searchBox.click();
      await docsPage.searchBox.type('api');

      // Should show search suggestions
      await expect(docsPage.searchSuggestions).toBeVisible();
      await expect(docsPage.searchSuggestionItems).toHaveCount.greaterThan(0);

      // Test suggestion selection
      const firstSuggestion = docsPage.searchSuggestionItems.first();
      const suggestionText = await firstSuggestion.textContent();
      await firstSuggestion.click();

      // Should navigate to suggested content
      await expect(docsPage.contentArea).toContainText(suggestionText || '');
    });

    test('should support advanced search filters @search', async () => {
      await docsPage.searchBox.click();
      await docsPage.advancedSearchToggle.click();

      await expect(docsPage.advancedSearchPanel).toBeVisible();

      // Test content type filtering
      await docsPage.searchContentTypeSelect.selectOption('api-reference');
      await docsPage.searchBox.fill('authentication');
      await docsPage.searchButton.click();

      await expect(docsPage.searchResults).toBeVisible();

      // Results should only include API reference content
      const resultItems = await docsPage.searchResultItems.all();
      for (const item of resultItems) {
        const resultType = await item.locator('.result-type').textContent();
        expect(resultType).toContain('API Reference');
      }

      // Test section filtering
      await docsPage.searchSectionSelect.selectOption('getting-started');
      await docsPage.searchButton.click();

      // Results should only include getting started content
      const filteredResults = await docsPage.searchResultItems.all();
      for (const item of filteredResults) {
        const breadcrumb = await item.locator('.result-breadcrumb').textContent();
        expect(breadcrumb).toContain('Getting Started');
      }
    });

    test('should handle search with no results @search', async () => {
      await docsPage.searchBox.fill('nonexistentterminologythatdoesnotexist123');
      await docsPage.page.keyboard.press('Enter');

      await expect(docsPage.noResultsMessage).toBeVisible();
      await expect(docsPage.noResultsMessage).toContainText(/no results found/i);

      // Should provide search suggestions
      await expect(docsPage.searchSuggestionsList).toBeVisible();
      await expect(docsPage.searchSuggestionsList).toContainText(/try searching for/i);
    });

    test('should provide search result highlighting @search', async () => {
      await docsPage.searchBox.fill('package status');
      await docsPage.page.keyboard.press('Enter');

      await expect(docsPage.searchResults).toBeVisible();

      // Search terms should be highlighted in results
      const resultSnippets = docsPage.searchResultItems.locator('.result-snippet');
      for (let i = 0; i < (await resultSnippets.count()); i++) {
        const snippet = resultSnippets.nth(i);
        const highlightedTerms = snippet.locator('.search-highlight');

        if ((await highlightedTerms.count()) > 0) {
          const highlightedText = await highlightedTerms.first().textContent();
          expect(['package', 'status']).toContain(highlightedText?.toLowerCase());
        }
      }
    });

    test('should support keyboard navigation in search @search @accessibility', async () => {
      await docsPage.searchBox.fill('api documentation');
      await docsPage.page.keyboard.press('Enter');

      await expect(docsPage.searchResults).toBeVisible();

      // Test keyboard navigation through results
      await docsPage.page.keyboard.press('Tab');
      await expect(docsPage.searchResultItems.first().locator('a')).toBeFocused();

      await docsPage.page.keyboard.press('ArrowDown');
      await expect(docsPage.searchResultItems.nth(1).locator('a')).toBeFocused();

      await docsPage.page.keyboard.press('Enter');
      // Should navigate to the selected result
      await expect(docsPage.contentArea).toBeVisible();
    });

    test('should maintain search history @search', async () => {
      const searchTerms = ['package tracking', 'api authentication', 'user management'];

      for (const term of searchTerms) {
        await docsPage.searchBox.fill(term);
        await docsPage.page.keyboard.press('Enter');
        await docsPage.waitForSearchResults();
      }

      // Clear search and check history
      await docsPage.searchBox.click();
      await docsPage.searchBox.fill('');

      if (await docsPage.searchHistory.isVisible()) {
        await expect(docsPage.searchHistory).toBeVisible();

        for (const term of searchTerms.slice(-3)) {
          // Last 3 searches
          await expect(docsPage.searchHistory).toContainText(term);
        }
      }
    });
  });

  test.describe('API Documentation and Interactive Examples', () => {
    test('should display comprehensive API reference @api-docs', async () => {
      await docsPage.apiReferenceLink.click();
      await expect(docsPage.apiReferenceContent).toBeVisible();

      // Verify API sections are present
      await expect(docsPage.authenticationSection).toBeVisible();
      await expect(docsPage.packagesSection).toBeVisible();
      await expect(docsPage.usersSection).toBeVisible();
      await expect(docsPage.trackingSection).toBeVisible();

      // Test endpoint documentation
      await docsPage.packagesSection.click();
      await expect(docsPage.endpointsList).toBeVisible();
      await expect(docsPage.endpointsList).toContainText('GET /api/packages');
      await expect(docsPage.endpointsList).toContainText('POST /api/packages');
      await expect(docsPage.endpointsList).toContainText('PUT /api/packages/{id}');
      await expect(docsPage.endpointsList).toContainText('DELETE /api/packages/{id}');
    });

    test('should provide interactive API examples @api-docs', async () => {
      await docsPage.apiReferenceLink.click();
      await docsPage.packagesSection.click();
      await docsPage.createPackageEndpoint.click();

      // Verify example request is shown
      await expect(docsPage.requestExample).toBeVisible();
      await expect(docsPage.requestExample).toContainText('POST /api/packages');

      // Test interactive request builder
      if (await docsPage.tryItOutButton.isVisible()) {
        await docsPage.tryItOutButton.click();
        await expect(docsPage.requestForm).toBeVisible();

        // Fill example request
        await docsPage.requestBodyInput.fill(
          JSON.stringify({
            trackingNumber: 'TEST123',
            weight: 1.5,
            dimensions: { length: 10, width: 8, height: 6 },
            destination: { address: '123 Test St', city: 'Toronto', province: 'ON' },
          })
        );

        // Note: In a real test, we might not want to actually send requests
        // await docsPage.executeRequestButton.click();
        // await expect(docsPage.responseExample).toBeVisible();
      }

      // Verify response examples
      await expect(docsPage.responseExample).toBeVisible();
      await expect(docsPage.responseExample).toContainText('200');
      await expect(docsPage.responseExample).toContainText('application/json');
    });

    test('should display request and response schemas @api-docs', async () => {
      await docsPage.apiReferenceLink.click();
      await docsPage.packagesSection.click();
      await docsPage.createPackageEndpoint.click();

      // Verify schema documentation
      await expect(docsPage.requestSchema).toBeVisible();
      await expect(docsPage.responseSchema).toBeVisible();

      // Test schema expansion/collapse
      await docsPage.expandSchemaButton.click();
      await expect(docsPage.schemaDetails).toBeVisible();

      // Verify required fields are marked
      await expect(docsPage.requiredFields).toContainText('trackingNumber');
      await expect(docsPage.requiredFields).toContainText('weight');

      // Verify field descriptions
      await expect(docsPage.schemaDetails).toContainText('Unique tracking identifier');
      await expect(docsPage.schemaDetails).toContainText('Package weight in kilograms');
    });

    test('should provide authentication documentation @api-docs', async () => {
      await docsPage.apiReferenceLink.click();
      await docsPage.authenticationSection.click();

      // Verify authentication methods are documented
      await expect(docsPage.jwtAuthSection).toBeVisible();
      await expect(docsPage.apiKeyAuthSection).toBeVisible();

      // Test code examples for different languages
      const languageTabs = ['curl', 'javascript', 'python', 'php'];

      for (const lang of languageTabs) {
        await docsPage.codeExampleTab(lang).click();
        await expect(docsPage.codeExample(lang)).toBeVisible();
        await expect(docsPage.codeExample(lang)).toContainText(/Authorization|Bearer|API/i);
      }
    });

    test('should display error codes and handling @api-docs', async () => {
      await docsPage.apiReferenceLink.click();
      await docsPage.errorHandlingSection.click();

      // Verify error codes are documented
      await expect(docsPage.errorCodesList).toBeVisible();
      await expect(docsPage.errorCodesList).toContainText('400 Bad Request');
      await expect(docsPage.errorCodesList).toContainText('401 Unauthorized');
      await expect(docsPage.errorCodesList).toContainText('404 Not Found');
      await expect(docsPage.errorCodesList).toContainText('429 Rate Limit Exceeded');
      await expect(docsPage.errorCodesList).toContainText('500 Internal Server Error');

      // Test error response examples
      await docsPage.errorExample('400').click();
      await expect(docsPage.errorResponseExample).toBeVisible();
      await expect(docsPage.errorResponseExample).toContainText('error');
      await expect(docsPage.errorResponseExample).toContainText('message');
    });

    test('should provide SDK and integration guides @api-docs', async () => {
      await docsPage.developersSection.click();
      await docsPage.sdkGuideLink.click();

      // Verify SDK documentation
      await expect(docsPage.sdkInstallation).toBeVisible();
      await expect(docsPage.sdkQuickStart).toBeVisible();

      // Test code samples for different SDKs
      const sdks = ['javascript', 'python', 'php', 'java'];

      for (const sdk of sdks) {
        await docsPage.sdkTab(sdk).click();
        await expect(docsPage.sdkExample(sdk)).toBeVisible();
        await expect(docsPage.sdkExample(sdk)).toContainText(/install|import|require/i);
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      // Mobile navigation should be present
      await expect(docsPage.mobileMenuButton).toBeVisible();
      await expect(docsPage.mobileSearchButton).toBeVisible();

      // Desktop navigation should be hidden
      await expect(docsPage.desktopNavigation).toBeHidden();

      // Test mobile menu
      await docsPage.mobileMenuButton.click();
      await expect(docsPage.mobileNavigationMenu).toBeVisible();

      // Test mobile search
      await docsPage.mobileSearchButton.click();
      await expect(docsPage.mobileSearchOverlay).toBeVisible();
    });

    test('should provide touch-friendly interface @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Test touch target sizes
      await assertions.checkTouchTargetSizes(page);

      // Test swipe navigation if supported
      await assertions.testSwipeGestures(page);

      // Test mobile-optimized content layout
      await expect(docsPage.mobileContentArea).toBeVisible();
      await expect(docsPage.mobileTableOfContents).toBeVisible();
    });

    test('should handle mobile search interactions @mobile @search', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await docsPage.mobileSearchButton.click();
      await docsPage.mobileSearchInput.fill('api authentication');
      await docsPage.mobileSearchSubmit.click();

      await expect(docsPage.mobileSearchResults).toBeVisible();

      // Test result selection on mobile
      await docsPage.mobileSearchResults.locator('a').first().tap();
      await expect(docsPage.contentArea).toBeVisible();
    });
  });

  test.describe('Performance and SEO Optimization', () => {
    test('should meet performance benchmarks @performance', async ({ page }) => {
      const startTime = Date.now();

      await docsPage.apiReferenceLink.click();
      await expect(docsPage.apiReferenceContent).toBeVisible();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Page navigation should be fast
      expect(loadTime).toBeLessThan(2000);

      // Test performance metrics
      await assertions.checkPerformanceMetrics(2000);

      // Test lazy loading of images
      await assertions.testLazyLoading(page);
    });

    test('should have proper SEO meta tags @seo', async ({ page }) => {
      // Check title tag
      const title = await page.title();
      expect(title).toContain('Documentation');
      expect(title).toContain('Shipnorth');

      // Check meta description
      const metaDescription = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.length).toBeGreaterThan(50);

      // Check canonical URL
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();

      // Check structured data
      const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
      if (structuredData) {
        const jsonLd = JSON.parse(structuredData);
        expect(jsonLd['@type']).toBeTruthy();
      }
    });

    test('should optimize for search engines @seo', async ({ page }) => {
      // Test heading structure
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Should have exactly one H1

      // Test image alt attributes
      const images = await page.locator('img').all();
      for (const image of images) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy();
      }

      // Test internal linking
      const internalLinks = await page.locator('a[href^="/docs"]').count();
      expect(internalLinks).toBeGreaterThan(5); // Should have good internal linking

      // Test robots.txt compliance
      await page.goto('/robots.txt');
      const robotsContent = await page.textContent('pre');
      expect(robotsContent).toContain('User-agent');

      // Return to docs
      await page.goto('/docs');
    });

    test('should support social sharing @seo', async () => {
      // Navigate to a specific documentation page
      await docsPage.apiReferenceLink.click();
      await docsPage.packagesSection.click();

      // Check Open Graph tags
      await expect(docsPage.page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(docsPage.page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(docsPage.page.locator('meta[property="og:url"]')).toHaveCount(1);

      // Check Twitter Card tags
      await expect(docsPage.page.locator('meta[name="twitter:card"]')).toHaveCount(1);
      await expect(docsPage.page.locator('meta[name="twitter:title"]')).toHaveCount(1);

      // Test share buttons if present
      if (await docsPage.shareButton.isVisible()) {
        await docsPage.shareButton.click();
        await expect(docsPage.shareOptions).toBeVisible();
      }
    });
  });

  test.describe('Content Versioning and Updates', () => {
    test('should display version information @versioning', async () => {
      // Check if version selector is present
      if (await docsPage.versionSelector.isVisible()) {
        await expect(docsPage.versionSelector).toBeVisible();
        await expect(docsPage.currentVersion).toBeVisible();

        // Test version switching
        await docsPage.versionSelector.click();
        await expect(docsPage.versionDropdown).toBeVisible();

        const versionOptions = docsPage.versionDropdown.locator('option');
        expect(await versionOptions.count()).toBeGreaterThan(0);
      }

      // Check last updated timestamp
      if (await docsPage.lastUpdated.isVisible()) {
        await expect(docsPage.lastUpdated).toBeVisible();
        const lastUpdatedText = await docsPage.lastUpdated.textContent();
        expect(lastUpdatedText).toMatch(/last updated|updated on/i);
      }
    });

    test('should provide changelog and release notes @versioning', async () => {
      // Navigate to changelog if available
      if (await docsPage.changelogLink.isVisible()) {
        await docsPage.changelogLink.click();
        await expect(docsPage.changelogContent).toBeVisible();

        // Verify changelog structure
        await expect(docsPage.releaseEntries).toHaveCount.greaterThan(0);

        const latestRelease = docsPage.releaseEntries.first();
        await expect(latestRelease).toContainText(/version|release/i);
        await expect(latestRelease).toContainText(/\d+\.\d+\.\d+/); // Version number pattern
      }
    });

    test('should handle deprecated content @versioning', async () => {
      // Look for deprecated API sections
      const deprecatedSections = docsPage.contentArea.locator(
        '.deprecated, [data-deprecated="true"]'
      );

      if ((await deprecatedSections.count()) > 0) {
        const firstDeprecated = deprecatedSections.first();
        await expect(firstDeprecated).toHaveClass(/deprecated/);

        // Should have deprecation notice
        await expect(firstDeprecated.locator('.deprecation-notice')).toBeVisible();

        // Should provide migration information
        await expect(firstDeprecated.locator('.migration-guide')).toBeVisible();
      }
    });
  });

  test.describe('Error Handling and 404 Pages', () => {
    test('should handle invalid documentation URLs @error-handling', async ({ page }) => {
      await page.goto('/docs/nonexistent-page-that-does-not-exist');

      // Should show 404 page
      await expect(docsPage.notFoundPage).toBeVisible();
      await expect(docsPage.notFoundTitle).toContainText(/not found|404/i);

      // Should provide helpful navigation
      await expect(docsPage.backToDocsButton).toBeVisible();
      await expect(docsPage.searchFromErrorButton).toBeVisible();
      await expect(docsPage.popularPagesLinks).toBeVisible();

      // Test navigation from 404 page
      await docsPage.backToDocsButton.click();
      await expect(docsPage.docsTitle).toBeVisible();
    });

    test('should handle broken internal links @error-handling', async ({ page }) => {
      // Simulate broken internal link
      await page.goto('/docs');

      // Override link to point to non-existent page
      await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = '/docs/broken-link-test';
        link.textContent = 'Test Broken Link';
        link.id = 'test-broken-link';
        document.body.appendChild(link);
      });

      await page.locator('#test-broken-link').click();

      // Should handle gracefully with 404 page
      await expect(docsPage.notFoundPage).toBeVisible();
      await expect(docsPage.brokenLinkReport).toBeVisible();
    });

    test('should handle search service errors @error-handling', async ({ page }) => {
      // Simulate search service error
      await page.route('**/api/search/**', (route) => route.abort());

      await docsPage.searchBox.fill('test search');
      await docsPage.page.keyboard.press('Enter');

      // Should show search error message
      await expect(docsPage.searchErrorMessage).toContainText(/search unavailable|search error/i);
      await expect(docsPage.searchRetryButton).toBeVisible();

      // Test retry functionality
      await page.unroute('**/api/search/**');
      await docsPage.searchRetryButton.click();

      // Should work after retry
      await expect(docsPage.searchResults).toBeVisible();
    });

    test('should maintain navigation during errors @error-handling', async ({ page }) => {
      // Simulate partial page load error
      await page.route('**/docs/api/**', (route) => route.abort());

      await docsPage.apiReferenceLink.click();

      // Navigation should still work even if content fails to load
      await expect(docsPage.navigationMenu).toBeVisible();
      await expect(docsPage.searchBox).toBeVisible();

      // Should show content load error
      await expect(docsPage.contentLoadError).toBeVisible();
      await expect(docsPage.refreshContentButton).toBeVisible();

      // Test content refresh
      await page.unroute('**/docs/api/**');
      await docsPage.refreshContentButton.click();

      await expect(docsPage.apiReferenceContent).toBeVisible();
    });
  });
});
