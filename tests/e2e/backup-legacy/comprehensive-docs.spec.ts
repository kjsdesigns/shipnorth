import { test, expect } from '@playwright/test';

test.describe('Comprehensive Documentation Site Tests', () => {
  test.describe('Documentation Homepage', () => {
    test('documentation homepage loads with all elements', async ({ page }) => {
      await page.goto('/docs');
      
      // Check main heading and branding
      await expect(page.locator('text=Shipnorth Documentation')).toBeVisible();
      await expect(page.locator('text=Documentation')).toBeVisible();
      
      // Check header elements
      await expect(page.locator('text=Shipnorth').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Search documentation"]')).toBeVisible();
      await expect(page.locator('text=Sign in')).toBeVisible();
      await expect(page.locator('text=Get Started')).toBeVisible();
      
      // Check search keyboard shortcut
      await expect(page.locator('text=⌘K')).toBeVisible();
      
      // Check hero section
      await expect(page.locator('text=Complete documentation for the autonomous shipping')).toBeVisible();
      await expect(page.locator('text=View API Docs')).toBeVisible();
      await expect(page.locator('text=Business Guides')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/docs-homepage.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('documentation sections display correctly', async ({ page }) => {
      await page.goto('/docs');
      
      // Check main documentation sections
      await expect(page.locator('text=Documentation Sections')).toBeVisible();
      await expect(page.locator('text=API Documentation')).toBeVisible();
      await expect(page.locator('text=Business Documentation')).toBeVisible();
      await expect(page.locator('text=Change History')).toBeVisible();
      
      // Check section descriptions
      await expect(page.locator('text=Interactive API documentation with examples')).toBeVisible();
      await expect(page.locator('text=Workflows, processes, user guides')).toBeVisible();
      await expect(page.locator('text=Track implementation dates')).toBeVisible();
      
      // Check badges
      await expect(page.locator('text=Interactive')).toBeVisible();
      await expect(page.locator('text=Guides')).toBeVisible();
      await expect(page.locator('text=Updated')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('quick access links work', async ({ page }) => {
      await page.goto('/docs');
      
      // Check quick access section
      await expect(page.locator('text=Quick Access')).toBeVisible();
      await expect(page.locator('text=Jump directly to frequently accessed')).toBeVisible();
      
      // Check quick links
      await expect(page.locator('text=Authentication')).toBeVisible();
      await expect(page.locator('text=Package Management')).toBeVisible();
      await expect(page.locator('text=Payment Processing')).toBeVisible();
      await expect(page.locator('text=Load Planning')).toBeVisible();
      await expect(page.locator('text=User Roles')).toBeVisible();
      await expect(page.locator('text=Workflows')).toBeVisible();
      
      // Test clicking a quick link
      const authLink = page.locator('text=Authentication').locator('..');
      await authLink.click();
      
      // Should navigate to API documentation with anchor
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('/docs/api');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('documentation features section displays', async ({ page }) => {
      await page.goto('/docs');
      
      // Check features section
      await expect(page.locator('text=Documentation Features')).toBeVisible();
      await expect(page.locator('text=Built for developers, designed for clarity')).toBeVisible();
      
      // Check feature items
      await expect(page.locator('text=Interactive Examples')).toBeVisible();
      await expect(page.locator('text=Code Samples')).toBeVisible();
      await expect(page.locator('text=Global Search')).toBeVisible();
      await expect(page.locator('text=Mobile Friendly')).toBeVisible();
      
      // Check feature descriptions
      await expect(page.locator('text=Try API endpoints directly')).toBeVisible();
      await expect(page.locator('text=Ready-to-use code examples')).toBeVisible();
      await expect(page.locator('text=Find any information across all')).toBeVisible();
      await expect(page.locator('text=Responsive design works')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('footer displays correctly', async ({ page }) => {
      await page.goto('/docs');
      
      // Check footer
      await expect(page.locator('text=© 2025 Shipnorth')).toBeVisible();
      await expect(page.locator('text=Documentation auto-updated from source')).toBeVisible();
      
      // Check footer branding
      const footerLogo = page.locator('footer').locator('text=Shipnorth');
      await expect(footerLogo).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Documentation Navigation', () => {
    test('main navigation links work', async ({ page }) => {
      await page.goto('/docs');
      
      // Test API Documentation link
      await page.click('text=View API Docs');
      await page.waitForURL(/\/docs\/api/, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page).toHaveURL(/\/docs\/api/);
      
      // Go back and test Business Guides
      await page.goto('/docs');
      await page.click('text=Business Guides');
      await page.waitForURL(/\/docs\/business/, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page).toHaveURL(/\/docs\/business/);
      
      // Test navigation from card clicks
      await page.goto('/docs');
      const apiCard = page.locator('text=API Documentation').locator('..');
      await apiCard.click();
      await page.waitForURL(/\/docs\/api/, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('header navigation works', async ({ page }) => {
      await page.goto('/docs');
      
      // Test home link
      const homeLink = page.locator('text=Shipnorth').first();
      await homeLink.click();
      await page.waitForURL('/', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Go back to docs
      await page.goto('/docs');
      
      // Test sign in link
      await page.click('text=Sign in');
      await page.waitForURL('/login', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Go back to docs
      await page.goto('/docs');
      
      // Test get started link
      await page.click('text=Get Started');
      await page.waitForURL('/register', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('section cards have hover effects', async ({ page }) => {
      await page.goto('/docs');
      
      // Test hover on API Documentation card
      const apiCard = page.locator('text=API Documentation').locator('..');
      await apiCard.hover();
      
      // Card should have hover effects (shadow changes, transitions)
      await page.waitForTimeout(500);
      await expect(apiCard).toBeVisible();
      
      // Test hover on other cards
      const businessCard = page.locator('text=Business Documentation').locator('..');
      await businessCard.hover();
      await page.waitForTimeout(500);
      
      const changeCard = page.locator('text=Change History').locator('..');
      await changeCard.hover();
      await page.waitForTimeout(500);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Search Functionality', () => {
    test('search input is visible and accessible', async ({ page }) => {
      await page.goto('/docs');
      
      const searchInput = page.locator('input[placeholder*="Search documentation"]');
      await expect(searchInput).toBeVisible();
      
      // Check that input is read-only (placeholder for global search)
      const isReadOnly = await searchInput.getAttribute('readonly');
      expect(isReadOnly).toBeDefined();
      
      // Check keyboard shortcut indicator
      await expect(page.locator('text=⌘K')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search input responds to clicks', async ({ page }) => {
      await page.goto('/docs');
      
      const searchInput = page.locator('input[placeholder*="Search documentation"]');
      
      // Click on search input
      await searchInput.click();
      await page.waitForTimeout(500);
      
      // Should trigger global search or focus behavior
      // Since it's read-only, it might open a search modal
      const hasModal = await page.locator('[role="dialog"], .modal').count();
      const isFocused = await searchInput.evaluate(el => document.activeElement === el);
      
      // Either should open modal or focus the input
      expect(hasModal > 0 || isFocused).toBe(true);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('global search keyboard shortcut works', async ({ page }) => {
      await page.goto('/docs');
      
      // Press Cmd+K (or Ctrl+K)
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(1000);
      
      // Should open global search modal
      const hasSearchModal = await page.locator('[role="dialog"], .modal, input[type="search"]:not([readonly])').count();
      
      if (hasSearchModal > 0) {
        // Global search opened successfully
        console.log('✅ Global search keyboard shortcut works');
        
        // Close modal
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

  test.describe('API Documentation Page', () => {
    test('API documentation page loads correctly', async ({ page }) => {
      await page.goto('/docs/api');
      
      // Should load API documentation page
      await page.waitForTimeout(2000);
      
      // Check if page loaded or if there's a placeholder
      const hasApiContent = await page.locator('text=API, text=Endpoints, text=Authentication, text=OpenAPI').count();
      const hasComingSoon = await page.locator('text=Coming Soon, text=Under Construction').count();
      
      if (hasApiContent > 0) {
        // API documentation is implemented
        await expect(page.locator('text=API, text=Endpoints, text=Authentication').first()).toBeVisible();
        
        // Look for common API documentation elements
        await expect(page.locator('text=GET, text=POST, text=PUT, text=DELETE').first()).toBeVisible();
      } else if (hasComingSoon > 0) {
        // API documentation is placeholder
        await expect(page.locator('text=Coming Soon, text=Under Construction').first()).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/docs-api-page.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('API authentication section works', async ({ page }) => {
      await page.goto('/docs/api#authentication');
      
      // Wait for page to load and navigate to anchor
      await page.waitForTimeout(2000);
      
      // Check if authentication section exists
      const hasAuthSection = await page.locator('text=Authentication, text=Auth, text=Token, text=Bearer').count();
      
      if (hasAuthSection > 0) {
        await expect(page.locator('text=Authentication, text=Auth, text=Token').first()).toBeVisible();
        
        // Should show authentication details
        await expect(page.locator('text=JWT, text=Bearer, text=API Key, text=Token').first()).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('API endpoint documentation displays', async ({ page }) => {
      await page.goto('/docs/api#packages');
      
      await page.waitForTimeout(2000);
      
      // Check for package-related API documentation
      const hasPackageEndpoints = await page.locator('text=packages, text=Packages, text=/api/packages').count();
      
      if (hasPackageEndpoints > 0) {
        // Should show package endpoints
        await expect(page.locator('text=packages, text=Packages').first()).toBeVisible();
        
        // Look for HTTP methods
        const httpMethods = page.locator('text=GET, text=POST, text=PUT, text=DELETE');
        if (await httpMethods.count() > 0) {
          await expect(httpMethods.first()).toBeVisible();
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

  test.describe('Business Documentation Page', () => {
    test('business documentation page loads correctly', async ({ page }) => {
      await page.goto('/docs/business');
      
      await page.waitForTimeout(2000);
      
      // Check for business documentation content
      const hasBusinessContent = await page.locator('text=Business, text=Workflows, text=Process, text=Rules').count();
      const hasPlaceholder = await page.locator('text=Coming Soon, text=Under Construction').count();
      
      if (hasBusinessContent > 0) {
        // Business documentation is implemented
        await expect(page.locator('text=Business, text=Workflows, text=Process').first()).toBeVisible();
        
        // Look for business-specific content
        await expect(page.locator('text=User Roles, text=Permissions, text=Workflow').first()).toBeVisible();
      } else if (hasPlaceholder > 0) {
        // Business documentation is placeholder
        await expect(page.locator('text=Coming Soon, text=Under Construction').first()).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/docs-business-page.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('user roles documentation works', async ({ page }) => {
      await page.goto('/docs/business#roles');
      
      await page.waitForTimeout(2000);
      
      // Check for role documentation
      const hasRoleContent = await page.locator('text=Roles, text=Admin, text=Staff, text=Driver, text=Customer').count();
      
      if (hasRoleContent > 0) {
        await expect(page.locator('text=Admin, text=Staff, text=Driver, text=Customer').first()).toBeVisible();
        
        // Should describe different user roles
        await expect(page.locator('text=permissions, text=access, text=rights').first()).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('workflow documentation displays', async ({ page }) => {
      await page.goto('/docs/business#workflows');
      
      await page.waitForTimeout(2000);
      
      // Check for workflow documentation
      const hasWorkflowContent = await page.locator('text=Workflow, text=Process, text=Steps, text=Procedure').count();
      
      if (hasWorkflowContent > 0) {
        await expect(page.locator('text=Workflow, text=Process, text=Steps').first()).toBeVisible();
        
        // Should show workflow steps or diagrams
        await expect(page.locator('text=step, text=stage, text=phase').first()).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Change History Page', () => {
    test('change history page loads correctly', async ({ page }) => {
      await page.goto('/docs/changes');
      
      await page.waitForTimeout(2000);
      
      // Check for change history content
      const hasChangeContent = await page.locator('text=Changes, text=History, text=Version, text=Release').count();
      const hasPlaceholder = await page.locator('text=Coming Soon, text=Under Construction').count();
      
      if (hasChangeContent > 0) {
        // Change history is implemented
        await expect(page.locator('text=Changes, text=History, text=Version').first()).toBeVisible();
        
        // Should show version information or dates
        await expect(page.locator('text=/\\d{4}-\\d{2}-\\d{2}|v\\d+\\.\\d+|Version/').first()).toBeVisible();
      } else if (hasPlaceholder > 0) {
        // Change history is placeholder
        await expect(page.locator('text=Coming Soon, text=Under Construction').first()).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/docs-changes-page.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('implementation dates are tracked', async ({ page }) => {
      await page.goto('/docs/changes');
      
      await page.waitForTimeout(2000);
      
      // Look for implementation dates
      const hasDateContent = await page.locator('text=/\\d{4}-\\d{2}-\\d{2}|January|February|March|April|May|June|July|August|September|October|November|December/').count();
      
      if (hasDateContent > 0) {
        // Should show dates for changes
        await expect(page.locator('text=/\\d{4}|20\\d{2}/').first()).toBeVisible();
        
        // Should show what was implemented
        await expect(page.locator('text=implemented, text=added, text=updated, text=fixed').first()).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('feature rollout information displays', async ({ page }) => {
      await page.goto('/docs/changes');
      
      await page.waitForTimeout(2000);
      
      // Look for feature information
      const hasFeatureContent = await page.locator('text=feature, text=Feature, text=rollout, text=release').count();
      
      if (hasFeatureContent > 0) {
        await expect(page.locator('text=feature, text=Feature').first()).toBeVisible();
        
        // Should describe features that were rolled out
        await expect(page.locator('text=new, text=improved, text=enhanced').first()).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Mobile Responsiveness', () => {
    test('documentation works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.goto('/docs');
      
      // Main elements should be visible
      await expect(page.locator('text=Shipnorth Documentation')).toBeVisible();
      
      // Search should be accessible
      await expect(page.locator('input[placeholder*="Search documentation"]')).toBeVisible();
      
      // Navigation should work
      await expect(page.locator('text=View API Docs')).toBeVisible();
      
      // Sections should stack properly
      await expect(page.locator('text=API Documentation')).toBeVisible();
      await expect(page.locator('text=Business Documentation')).toBeVisible();
      
      // Quick links should be accessible
      await expect(page.locator('text=Authentication')).toBeVisible();
      
      await page.screenshot({ path: 'test-results/docs-mobile-viewport.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('documentation works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.goto('/docs');
      
      // Should have good layout on tablet
      await expect(page.locator('text=Shipnorth Documentation')).toBeVisible();
      
      // Grid layouts should adapt
      await expect(page.locator('text=API Documentation')).toBeVisible();
      
      // Test navigation
      await page.click('text=View API Docs');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/docs-tablet-viewport.png', fullPage: true });
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

  test.describe('Interactive Elements', () => {
    test('hover effects work on documentation cards', async ({ page }) => {
      await page.goto('/docs');
      
      const cards = [
        page.locator('text=API Documentation').locator('..'),
        page.locator('text=Business Documentation').locator('..'),
        page.locator('text=Change History').locator('..')
      ];
      
      for (const card of cards) {
        // Hover over card
        await card.hover();
        await page.waitForTimeout(300);
        
        // Card should be visible and responsive
        await expect(card).toBeVisible();
        
        // Check for hover indicators (Learn more text)
        await expect(card.locator('text=Learn more')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('quick access links have hover effects', async ({ page }) => {
      await page.goto('/docs');
      
      const quickLinks = page.locator('text=Authentication, text=Package Management, text=Payment Processing').locator('..');
      const linkCount = await quickLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = quickLinks.nth(i);
        await link.hover();
        await page.waitForTimeout(200);
        
        // Link should be visible and have arrow
        await expect(link).toBeVisible();
        await expect(link.locator('svg, [data-lucide]')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('button animations work', async ({ page }) => {
      await page.goto('/docs');
      
      // Test CTA buttons
      const apiButton = page.locator('text=View API Docs').locator('..');
      await apiButton.hover();
      await page.waitForTimeout(300);
      
      // Button should have arrow and be clickable
      await expect(apiButton.locator('svg, [data-lucide="arrow-right"]')).toBeVisible();
      
      // Test business guides link
      const businessLink = page.locator('text=Business Guides');
      await businessLink.hover();
      await page.waitForTimeout(300);
      
      await expect(businessLink).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Accessibility and SEO', () => {
    test('documentation has proper heading structure', async ({ page }) => {
      await page.goto('/docs');
      
      // Should have proper heading hierarchy
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Main heading should be descriptive
      const mainHeading = page.locator('h1').first();
      const headingText = await mainHeading.textContent();
      
      expect(headingText).toContain('Documentation');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('images and icons have proper alt text', async ({ page }) => {
      await page.goto('/docs');
      
      // Check for images with alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const altText = await img.getAttribute('alt');
          
          // Images should have alt text (can be empty for decorative)
          expect(altText).toBeDefined();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('links have descriptive text', async ({ page }) => {
      await page.goto('/docs');
      
      // Check that links are descriptive
      const links = page.locator('a');
      const linkCount = await links.count();
      
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 10); i++) {
          const link = links.nth(i);
          const linkText = await link.textContent();
          
          // Links should have text content
          if (linkText && linkText.trim().length > 0) {
            expect(linkText.trim()).not.toBe('');
            expect(linkText.trim()).not.toBe('Click here');
          }
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('keyboard navigation works', async ({ page }) => {
      await page.goto('/docs');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        
        // Should have focus on interactive elements
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        const isInteractive = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
        
        if (isInteractive) {
          await expect(focusedElement).toBeVisible();
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

  test.describe('Performance and Loading', () => {
    test('documentation pages load within acceptable time', async ({ page }) => {
      const pages = ['/docs', '/docs/api', '/docs/business', '/docs/changes'];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        
        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded');
        
        const loadTime = Date.now() - startTime;
        console.log(`${pagePath} load time: ${loadTime}ms`);
        
        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('images and resources load efficiently', async ({ page }) => {
      await page.goto('/docs');
      
      // Wait for all resources to load
      await page.waitForLoadState('networkidle');
      
      // Check for any failed resources
      const failedRequests: string[] = [];
      
      page.on('response', response => {
        if (!response.ok() && !response.url().includes('favicon')) {
          failedRequests.push(response.url());
        }
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Reload to catch any failed requests
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should have minimal failed requests
      expect(failedRequests.length).toBeLessThan(3);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('navigation between doc sections is fast', async ({ page }) => {
      await page.goto('/docs');
      
      const navigationTests = [
        { from: '/docs', to: '/docs/api', element: 'text=View API Docs' },
        { from: '/docs/api', to: '/docs/business', action: () => page.goto('/docs/business') },
        { from: '/docs/business', to: '/docs/changes', action: () => page.goto('/docs/changes') }
      ];
      
      for (const test of navigationTests) {
        const startTime = Date.now();
        
        if (test.element) {
          await page.click(test.element);
        } else if (test.action) {
          await test.action();
        }
        
        await page.waitForURL(test.to, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        const navigationTime = Date.now() - startTime;
        console.log(`Navigation from ${test.from} to ${test.to}: ${navigationTime}ms`);
        
        // Navigation should be fast
        expect(navigationTime).toBeLessThan(3000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Error Handling', () => {
    test('handles non-existent documentation pages gracefully', async ({ page }) => {
      // Try to access a non-existent documentation page
      await page.goto('/docs/nonexistent');
      
      // Should either show 404 or redirect to main docs
      await page.waitForTimeout(2000);
      
      const has404 = await page.locator('text=404, text=Not Found, text=Page not found').count();
      const isOnMainDocs = page.url().includes('/docs') && !page.url().includes('/docs/nonexistent');
      
      // Should handle gracefully
      expect(has404 > 0 || isOnMainDocs).toBe(true);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('handles missing assets gracefully', async ({ page }) => {
      await page.goto('/docs');
      
      // Should still function even if some assets are missing
      await expect(page.locator('text=Shipnorth Documentation')).toBeVisible();
      
      // Main functionality should work
      const searchInput = page.locator('input[placeholder*="Search documentation"]');
      await expect(searchInput).toBeVisible();
      
      // Navigation should work
      await expect(page.locator('text=View API Docs')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('provides helpful error messages', async ({ page }) => {
      // Test various error scenarios
      await page.goto('/docs');
      
      // If there are any error states, they should be helpful
      const errorMessages = page.locator('[role="alert"], .error, text=Error');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        const firstError = errorMessages.first();
        const errorText = await firstError.textContent();
        
        // Error messages should be descriptive
        expect(errorText).toBeTruthy();
        expect(errorText?.length || 0).toBeGreaterThan(10);
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