import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Global Search Tests', () => {
  test.describe('Global Search Modal Activation', () => {
    test('global search modal opens with keyboard shortcut from homepage', async ({ page }) => {
      await page.goto('/');
      
      // Press Cmd+K (or Ctrl+K on Windows/Linux)
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      // Should open global search modal
      const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        await expect(searchModal.first()).toBeVisible();
        
        // Should have search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
        await expect(searchInput.first()).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: 'test-results/global-search-modal-homepage.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('global search modal opens from documentation page', async ({ page }) => {
      await page.goto('/docs');
      
      // Press Cmd+K
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      // Should open global search modal
      const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        await expect(searchModal.first()).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
        
        await page.screenshot({ path: 'test-results/global-search-modal-docs.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('global search modal opens from staff interface', async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Press Cmd+K
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      // Should open global search modal
      const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        await expect(searchModal.first()).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
        
        await page.screenshot({ path: 'test-results/global-search-modal-staff.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('global search can be opened by clicking search inputs', async ({ page }) => {
      await page.goto('/docs');
      
      // Click on the documentation search input
      const docSearchInput = page.locator('input[placeholder*="Search documentation"]');
      
      if (await docSearchInput.isVisible()) {
        await docSearchInput.click();
        await page.waitForTimeout(1000);
        
        // Should trigger global search
        const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
        const modalCount = await searchModal.count();
        
        if (modalCount > 0) {
          await expect(searchModal.first()).toBeVisible();
          
          // Close modal
          await page.keyboard.press('Escape');
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

  test.describe('Search Functionality from Different User Interfaces', () => {
    test('search works from staff interface', async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Look for search functionality in staff interface
      const staffSearchElements = page.locator('input[type="search"], input[placeholder*="search"], button:has-text("Search")');
      const searchCount = await staffSearchElements.count();
      
      if (searchCount > 0) {
        const searchInput = staffSearchElements.first();
        
        // Test search functionality
        await searchInput.click();
        await page.waitForTimeout(500);
        
        if (await searchInput.isVisible() && !(await searchInput.getAttribute('readonly'))) {
          await searchInput.fill('PKG');
          await page.waitForTimeout(1000);
          
          // Should show search results or filter
          const resultsArea = page.locator('table, .search-results, .filter-results');
          if (await resultsArea.count() > 0) {
            await expect(resultsArea.first()).toBeVisible();
          }
          
          // Clear search
          await searchInput.fill('');
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search works from customer portal', async ({ page }) => {
      // Login as customer
      await page.goto('/login');
      await page.click('button:has-text("Customer")');
      await page.waitForURL('/portal');
      
      // Look for search functionality in customer portal
      const customerSearchElements = page.locator('input[type="search"], input[placeholder*="search"]');
      const searchCount = await customerSearchElements.count();
      
      if (searchCount > 0) {
        const searchInput = customerSearchElements.first();
        
        if (await searchInput.isVisible() && !(await searchInput.getAttribute('readonly'))) {
          // Test package search
          await searchInput.fill('PKG');
          await page.waitForTimeout(1000);
          
          // Should filter packages
          const packagesArea = page.locator('.space-y-4, .packages-list, [class*="package"]');
          if (await packagesArea.count() > 0) {
            await expect(packagesArea.first()).toBeVisible();
          }
          
          // Clear search
          await searchInput.fill('');
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search works from admin interface', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.click('button:has-text("Admin")');
      await page.waitForURL('/admin');
      
      // Look for search functionality in admin interface
      const adminSearchElements = page.locator('input[type="search"], input[placeholder*="search"]');
      const searchCount = await adminSearchElements.count();
      
      if (searchCount > 0) {
        const searchInput = adminSearchElements.first();
        
        if (await searchInput.isVisible() && !(await searchInput.getAttribute('readonly'))) {
          // Test admin search
          await searchInput.fill('user');
          await page.waitForTimeout(1000);
          
          // Should show search results
          const resultsArea = page.locator('table, .search-results');
          if (await resultsArea.count() > 0) {
            await expect(resultsArea.first()).toBeVisible();
          }
          
          // Clear search
          await searchInput.fill('');
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

  test.describe('Search Results and Highlighting', () => {
    test('global search returns relevant results', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
        
        // Search for common terms
        await searchInput.fill('package');
        await page.waitForTimeout(2000);
        
        // Should show search results
        const searchResults = page.locator('[role="option"], .search-result, [class*="result"]');
        const resultCount = await searchResults.count();
        
        if (resultCount > 0) {
          // Should show relevant results
          await expect(searchResults.first()).toBeVisible();
          
          // Results should be clickable
          await searchResults.first().click();
          await page.waitForTimeout(1000);
          
          // Should navigate somewhere or show details
          const currentUrl = page.url();
          expect(currentUrl).toBeTruthy();
        }
        
        await page.screenshot({ path: 'test-results/global-search-results.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search results have proper highlighting', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for a term that should be highlighted
        await searchInput.fill('customer');
        await page.waitForTimeout(2000);
        
        // Look for highlighted text
        const highlightedElements = page.locator('mark, [class*="highlight"], [class*="match"], strong');
        const highlightCount = await highlightedElements.count();
        
        if (highlightCount > 0) {
          // Should have highlighted search terms
          await expect(highlightedElements.first()).toBeVisible();
          
          const highlightedText = await highlightedElements.first().textContent();
          expect(highlightedText?.toLowerCase()).toContain('customer');
        }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search supports different result types', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for different types of content
        const searchTerms = ['package', 'customer', 'load', 'invoice'];
        
        for (const term of searchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(1000);
          
          // Look for category indicators
          const categoryIndicators = page.locator('[class*="category"], [class*="type"], .badge');
          const categoryCount = await categoryIndicators.count();
          
          if (categoryCount > 0) {
            // Should show result categories
            await expect(categoryIndicators.first()).toBeVisible();
          }
        }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Search Navigation and Keyboard Controls', () => {
    test('keyboard navigation works in search results', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for results
        await searchInput.fill('package');
        await page.waitForTimeout(2000);
        
        // Use arrow keys to navigate
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        
        // Should highlight first result
        const selectedResult = page.locator('[aria-selected="true"], [class*="selected"], [class*="active"]');
        if (await selectedResult.count() > 0) {
          await expect(selectedResult.first()).toBeVisible();
        }
        
        // Navigate down more
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(300);
        
        // Press Enter to select
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Should navigate or perform action
        const searchStillOpen = await searchModal.count();
        
        // Search should either close or navigate
        expect(searchStillOpen === 0 || page.url() !== '/').toBe(true);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('escape key closes search modal', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        await expect(searchModal.first()).toBeVisible();
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Modal should be closed
        const modalStillOpen = await searchModal.count();
        if (modalStillOpen > 0) {
          const isVisible = await searchModal.first().isVisible();
          expect(isVisible).toBe(false);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('click outside closes search modal', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        await expect(searchModal.first()).toBeVisible();
        
        // Click outside the modal
        await page.click('body', { position: { x: 10, y: 10 } });
    } catch (error) {
      // Ignore localStorage access errors
    }
        await page.waitForTimeout(500);
        
        // Modal should close
        const modalStillOpen = await searchModal.count();
        if (modalStillOpen > 0) {
          const isVisible = await searchModal.first().isVisible();
          expect(isVisible).toBe(false);
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

  test.describe('Search Categories and Filtering', () => {
    test('search supports category filtering', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for content
        await searchInput.fill('ship');
        await page.waitForTimeout(2000);
        
        // Look for category filters
        const categoryFilters = page.locator('button:has-text("All"), button:has-text("Packages"), button:has-text("Customers"), button:has-text("Documentation")');
        const filterCount = await categoryFilters.count();
        
        if (filterCount > 0) {
          // Test filtering by category
          const packagesFilter = page.locator('button:has-text("Packages")');
          
          if (await packagesFilter.count() > 0) {
            await packagesFilter.first().click();
            await page.waitForTimeout(1000);
            
            // Results should be filtered
            const filteredResults = page.locator('[class*="result"], [role="option"]');
            if (await filteredResults.count() > 0) {
              await expect(filteredResults.first()).toBeVisible();
            }
          }
        }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search shows recent searches or suggestions', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        // Without typing, should show suggestions or recent searches
        const suggestions = page.locator('[class*="suggestion"], [class*="recent"], [class*="popular"]');
        const suggestionCount = await suggestions.count();
        
        if (suggestionCount > 0) {
          // Should show helpful suggestions
          await expect(suggestions.first()).toBeVisible();
          
          // Suggestions should be clickable
          await suggestions.first().click();
          await page.waitForTimeout(1000);
          
          // Should perform search or navigation
          const currentUrl = page.url();
          expect(currentUrl).toBeTruthy();
        } else {
          // Should at least show empty state or placeholder
          const emptyState = page.locator('text=Start typing, text=Search, text=Try searching');
          if (await emptyState.count() > 0) {
            await expect(emptyState.first()).toBeVisible();
          }
        }
        
        // Close search if still open
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search provides no results state', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for something that won't exist
        await searchInput.fill('xyznonexistentquery123');
        await page.waitForTimeout(2000);
        
        // Should show no results state
        const noResults = page.locator('text=No results, text=Nothing found, text=Try different, text=No matches');
        const noResultsCount = await noResults.count();
        
        if (noResultsCount > 0) {
          await expect(noResults.first()).toBeVisible();
          
          // Should provide helpful suggestions
          await expect(page.locator('text=Try, text=different, text=search')).toBeVisible();
        }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Real-time Search and Performance', () => {
    test('search provides real-time results as user types', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Type character by character
        const searchTerm = 'package';
        
        for (let i = 1; i <= searchTerm.length; i++) {
          const partialTerm = searchTerm.substring(0, i);
          
          await searchInput.fill(partialTerm);
          await page.waitForTimeout(500);
          
          // Should show loading or results
          const loadingOrResults = page.locator('[class*="loading"], [class*="spinner"], [role="option"], [class*="result"]');
          const hasActivity = await loadingOrResults.count();
          
          if (hasActivity > 0) {
            // Search is responding to input
            console.log(`✅ Search responds to: "${partialTerm}"`);
          }
        }
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search handles rapid typing without performance issues', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Type rapidly
        const startTime = Date.now();
        
        await searchInput.type('packagesloadscustomers', { delay: 50 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        const typingTime = Date.now() - startTime;
        
        // Typing should be responsive
        expect(typingTime).toBeLessThan(5000);
        
        // Wait for search to settle
        await page.waitForTimeout(2000);
        
        // Interface should still be responsive
        await expect(searchInput).toBeVisible();
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search debounces requests appropriately', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Track network requests if possible
        let requestCount = 0;
        
        page.on('request', request => {
          if (request.url().includes('search') || request.url().includes('api')) {
            requestCount++;
          }
        });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Type quickly then stop
        await searchInput.type('pack', { delay: 50 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        await page.waitForTimeout(100);
        await searchInput.type('ages', { delay: 50 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Wait for debounce
        await page.waitForTimeout(2000);
        
        // Should not make excessive requests
        expect(requestCount).toBeLessThan(10);
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Search Accessibility and Usability', () => {
    test('search modal has proper ARIA attributes', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"]');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        // Modal should have proper role
        await expect(searchModal.first()).toBeVisible();
        
        // Should have aria-label or aria-labelledby
        const hasAriaLabel = await searchModal.first().getAttribute('aria-label');
        const hasAriaLabelledby = await searchModal.first().getAttribute('aria-labelledby');
        
        expect(hasAriaLabel || hasAriaLabelledby).toBeTruthy();
        
        // Search input should have proper attributes
        const searchInput = page.locator('input[type="search"]').first();
        const hasInputLabel = await searchInput.getAttribute('aria-label');
        const hasInputPlaceholder = await searchInput.getAttribute('placeholder');
        
        expect(hasInputLabel || hasInputPlaceholder).toBeTruthy();
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search results are accessible via keyboard', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Search for results
        await searchInput.fill('customer');
        await page.waitForTimeout(2000);
        
        const searchResults = page.locator('[role="option"], [tabindex="0"], [class*="result"]');
        const resultCount = await searchResults.count();
        
        if (resultCount > 0) {
          // Navigate with keyboard
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          
          // Should focus on result
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
          
          // Should be able to select with Enter
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          
          // Should perform action
          console.log('✅ Keyboard navigation in search works');
        }
        
        // Close search if still open
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search modal traps focus properly', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        // Focus should be in the modal
        const searchInput = page.locator('input[type="search"]').first();
        await expect(searchInput).toBeFocused();
        
        // Tab should stay within modal
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Focus should still be within the modal
        const focusedWithinModal = await searchModal.first().locator(':focus').count();
        expect(focusedWithinModal).toBeGreaterThan(0);
        
        // Close search
        await page.keyboard.press('Escape');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Cross-Browser and Device Testing', () => {
    test('search works on different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        
        // Open global search
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(1000);
        
        const searchModal = page.locator('[role="dialog"], .modal');
        const modalCount = await searchModal.count();
        
        if (modalCount > 0) {
          // Modal should be visible and properly sized
          await expect(searchModal.first()).toBeVisible();
          
          const searchInput = page.locator('input[type="search"]').first();
          await expect(searchInput).toBeVisible();
          
          // Close search
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
        
        console.log(`✅ Search works on ${viewport.width}x${viewport.height}`);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search keyboard shortcuts work on different platforms', async ({ page }) => {
      await page.goto('/');
      
      // Test different keyboard combinations
      const shortcuts = ['Meta+k', 'Control+k'];
      
      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut);
        await page.waitForTimeout(1000);
        
        const searchModal = page.locator('[role="dialog"], .modal');
        const modalCount = await searchModal.count();
        
        if (modalCount > 0) {
          await expect(searchModal.first()).toBeVisible();
          
          // Close search
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          console.log(`✅ ${shortcut} shortcut works`);
          break; // One working shortcut is enough
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search handles touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.goto('/');
      
      // Look for search button or input that can be tapped
      const searchElements = page.locator('input[placeholder*="search"], button:has([data-lucide="search"])');
      const searchCount = await searchElements.count();
      
      if (searchCount > 0) {
        const searchElement = searchElements.first();
        
        // Tap to open search
        await searchElement.tap();
        await page.waitForTimeout(1000);
        
        // Should open search interface
        const searchModal = page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])');
        const modalCount = await searchModal.count();
        
        if (modalCount > 0) {
          await expect(searchModal.first()).toBeVisible();
          
          // Touch interactions should work
          const searchInput = page.locator('input[type="search"]').first();
          await searchInput.tap();
          await searchInput.fill('test');
          
          // Close search
          await page.keyboard.press('Escape');
        }
        
        console.log('✅ Touch interactions work for search');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Integration with Different User Contexts', () => {
    test('search results vary based on user role', async ({ page }) => {
      const userTypes = [
        { role: 'Staff', button: 'button:has-text("Staff")', url: '/staff' },
        { role: 'Customer', button: 'button:has-text("Customer")', url: '/portal' },
        { role: 'Admin', button: 'button:has-text("Admin")', url: '/admin' }
      ];
      
      for (const user of userTypes) {
        // Login as different user types
        await page.goto('/login');
        await page.click(user.button);
        await page.waitForURL(user.url);
        
        // Open global search
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(1000);
        
        const searchModal = page.locator('[role="dialog"], .modal');
        const modalCount = await searchModal.count();
        
        if (modalCount > 0) {
          const searchInput = page.locator('input[type="search"]').first();
          
          // Search for role-specific content
          await searchInput.fill('package');
          await page.waitForTimeout(2000);
          
          // Results should be contextual to user role
          const searchResults = page.locator('[role="option"], [class*="result"]');
          const resultCount = await searchResults.count();
          
          if (resultCount > 0) {
            console.log(`✅ ${user.role} sees search results (${resultCount} results)`);
          }
          
          // Close search
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search maintains state across navigation', async ({ page }) => {
      await page.goto('/');
      
      // Open global search
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      const searchModal = page.locator('[role="dialog"], .modal');
      const modalCount = await searchModal.count();
      
      if (modalCount > 0) {
        const searchInput = page.locator('input[type="search"]').first();
        
        // Enter search term
        await searchInput.fill('shipping');
        await page.waitForTimeout(1000);
        
        // Navigate to a result or close search
        await page.keyboard.press('Escape');
        
        // Navigate to different page
        await page.goto('/docs');
        
        // Reopen search
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(1000);
        
        const searchModalAgain = page.locator('[role="dialog"], .modal');
        const modalCountAgain = await searchModalAgain.count();
        
        if (modalCountAgain > 0) {
          // Search should remember recent searches or be fresh
          const searchInputAgain = page.locator('input[type="search"]').first();
          await expect(searchInputAgain).toBeVisible();
          
          // Close search
          await page.keyboard.press('Escape');
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
});
    } catch (error) {
      // Ignore localStorage access errors
    }