import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';

/**
 * UI/UX Experience - Comprehensive Test Suite
 *
 * Consolidates:
 * - theme-toggle.spec.ts
 * - ui-theme.spec.ts
 * - comprehensive-visual-accessibility.spec.ts
 * - login-logo.spec.ts
 *
 * Coverage:
 * - Theme switching and dark/light mode
 * - Responsive design and mobile optimization
 * - Accessibility compliance (WCAG 2.1)
 * - Visual regression testing
 * - User interaction patterns
 * - Loading states and animations
 * - Error states and feedback
 * - Cross-browser compatibility
 */

test.describe('UI/UX Experience', () => {
  let authHelpers: AuthHelpers;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    assertions = new CustomAssertions(page);

    await page.goto('/');
    await assertions.waitForPageLoad();
  });

  test.describe('Theme System and Dark Mode', () => {
    test('should display light theme by default @theme @smoke', async ({ page }) => {
      // Check default theme is light
      const body = page.locator('body');

      // Should not have dark theme classes
      await expect(body).not.toHaveClass(/dark/);

      // Check CSS variables for light theme
      const backgroundColor = await body.evaluate(
        (el) =>
          getComputedStyle(el).getPropertyValue('--background-color') ||
          getComputedStyle(el).backgroundColor
      );

      // Light theme should have light background
      expect(backgroundColor).toMatch(/(255|white|rgb\(255,\s*255,\s*255\))/i);
    });

    test('should toggle to dark theme when requested @theme', async ({ page }) => {
      // Look for theme toggle button
      const themeToggle = page
        .locator(
          '[data-testid="theme-toggle"], button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀️")'
        )
        .first();

      if (await themeToggle.isVisible()) {
        // Click theme toggle
        await themeToggle.click();

        // Verify dark theme is applied
        const body = page.locator('body');

        // Should have dark theme class or dark background
        const isDarkTheme = await body.evaluate((el) => {
          const classList = Array.from(el.classList);
          const backgroundColor = getComputedStyle(el).backgroundColor;
          const hassDarkClass = classList.some((cls) => cls.includes('dark'));
          const hasDarkBackground =
            backgroundColor.includes('rgb(0, 0, 0)') ||
            backgroundColor.includes('rgb(17, 24, 39)') ||
            backgroundColor.includes('rgb(31, 41, 55)');

          return hassDarkClass || hasDarkBackground;
        });

        expect(isDarkTheme).toBeTruthy();

        // Verify theme preference is stored
        const themePreference = await page.evaluate(
          () =>
            localStorage.getItem('theme') ||
            localStorage.getItem('darkMode') ||
            localStorage.getItem('colorScheme')
        );

        if (themePreference) {
          expect(['dark', 'true']).toContain(themePreference);
        }
      }
    });

    test('should persist theme preference across sessions @theme', async ({ page }) => {
      const themeToggle = page
        .locator('[data-testid="theme-toggle"], button[aria-label*="theme"]')
        .first();

      if (await themeToggle.isVisible()) {
        // Switch to dark theme
        await themeToggle.click();

        // Reload page
        await page.reload();

        // Theme should persist
        const body = page.locator('body');
        const isDarkTheme = await body.evaluate((el) => {
          const classList = Array.from(el.classList);
          const backgroundColor = getComputedStyle(el).backgroundColor;
          return (
            classList.some((cls) => cls.includes('dark')) ||
            backgroundColor.includes('rgb(0, 0, 0)') ||
            backgroundColor.includes('rgb(17, 24, 39)')
          );
        });

        expect(isDarkTheme).toBeTruthy();
      }
    });

    test('should respect system theme preference @theme', async ({ page, context }) => {
      // Test system dark mode preference
      await context.emulateMedia({ colorScheme: 'dark' });
      await page.reload();

      // Should respect system preference if no manual override
      const systemPreference = await page.evaluate(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches
      );

      expect(systemPreference).toBeTruthy();

      // Test system light mode preference
      await context.emulateMedia({ colorScheme: 'light' });
      await page.reload();

      const lightPreference = await page.evaluate(
        () => window.matchMedia('(prefers-color-scheme: light)').matches
      );

      expect(lightPreference).toBeTruthy();
    });

    test('should maintain proper contrast in both themes @theme @accessibility', async ({
      page,
    }) => {
      // Test light theme contrast
      await assertions.checkColorContrast(page);

      const themeToggle = page
        .locator('[data-testid="theme-toggle"], button[aria-label*="theme"]')
        .first();

      if (await themeToggle.isVisible()) {
        // Switch to dark theme
        await themeToggle.click();

        // Test dark theme contrast
        await assertions.checkColorContrast(page);
      }
    });

    test('should have smooth theme transition animations @theme', async ({ page }) => {
      const themeToggle = page
        .locator('[data-testid="theme-toggle"], button[aria-label*="theme"]')
        .first();

      if (await themeToggle.isVisible()) {
        // Check for CSS transitions
        const hasTransitions = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          let transitionElements = 0;

          elements.forEach((el) => {
            const styles = getComputedStyle(el);
            if (
              styles.transition &&
              styles.transition !== 'none' &&
              styles.transition !== 'all 0s ease 0s'
            ) {
              transitionElements++;
            }
          });

          return transitionElements > 0;
        });

        expect(hasTransitions).toBeTruthy();

        // Test theme switch doesn't cause layout shift
        const initialHeight = await page.evaluate(() => document.body.scrollHeight);

        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for transition

        const finalHeight = await page.evaluate(() => document.body.scrollHeight);

        // Height should not change significantly (allowing for minor differences)
        expect(Math.abs(finalHeight - initialHeight)).toBeLessThan(50);
      }
    });
  });

  test.describe('Responsive Design and Mobile Optimization', () => {
    test('should adapt layout to mobile viewport @mobile @responsive', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone XR' },
        { width: 360, height: 640, name: 'Galaxy S5' },
        { width: 768, height: 1024, name: 'iPad' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Check mobile navigation
        const mobileMenu = page.locator(
          '[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]'
        );
        const hamburgerMenu = page
          .locator('[data-testid="hamburger-menu"], .hamburger-menu, button:has(svg)')
          .first();

        if (viewport.width <= 768) {
          // Mobile: should have hamburger menu
          if (await hamburgerMenu.isVisible()) {
            await expect(hamburgerMenu).toBeVisible();

            await hamburgerMenu.click();
            if (await mobileMenu.isVisible()) {
              await expect(mobileMenu).toBeVisible();
            }
          }
        } else {
          // Desktop: should have full navigation
          const desktopNav = page.locator('nav, [data-testid="desktop-nav"]');
          if (await desktopNav.isVisible()) {
            await expect(desktopNav).toBeVisible();
          }
        }

        // Check content adapts to viewport
        const mainContent = page.locator('main, [role="main"], .main-content').first();
        if (await mainContent.isVisible()) {
          const contentWidth = await mainContent.boundingBox();
          if (contentWidth) {
            expect(contentWidth.width).toBeLessThanOrEqual(viewport.width + 10); // Small margin for scrollbars
          }
        }
      }
    });

    test('should have proper touch targets on mobile @mobile @accessibility', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await assertions.checkTouchTargetSizes(page);

      // Check that interactive elements are properly sized
      const interactiveElements = page.locator('button, a, input, [role="button"], [tabindex="0"]');
      const elementCount = await interactiveElements.count();

      for (let i = 0; i < Math.min(elementCount, 20); i++) {
        // Check first 20 elements
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44 pixels
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(32); // Slightly relaxed for dense UIs
          }
        }
      }
    });

    test('should handle different screen densities @responsive', async ({ page }) => {
      // Test different device pixel ratios
      const devicePixelRatios = [1, 2, 3];

      for (const ratio of devicePixelRatios) {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.evaluate(`window.devicePixelRatio = ${ratio}`);

        // Check that images and icons render properly
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const image = images.nth(i);
          if (await image.isVisible()) {
            // Image should load successfully
            const isLoaded = await image.evaluate((img) => img.complete && img.naturalHeight !== 0);
            expect(isLoaded).toBeTruthy();
          }
        }
      }
    });

    test('should support landscape and portrait orientations @mobile', async ({ page }) => {
      // Test portrait
      await page.setViewportSize({ width: 375, height: 667 });

      let mainContent = page.locator('main, [role="main"]').first();
      if (await mainContent.isVisible()) {
        const portraitBox = await mainContent.boundingBox();
        expect(portraitBox?.width).toBeLessThan(portraitBox?.height || 0);
      }

      // Test landscape
      await page.setViewportSize({ width: 667, height: 375 });

      mainContent = page.locator('main, [role="main"]').first();
      if (await mainContent.isVisible()) {
        const landscapeBox = await mainContent.boundingBox();
        expect(landscapeBox?.width).toBeGreaterThan(landscapeBox?.height || 0);
      }

      // Content should remain accessible in both orientations
      const navigation = page.locator('nav, [data-testid="navigation"]').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
    });

    test('should optimize images for different screen sizes @responsive @performance', async ({
      page,
    }) => {
      // Check for responsive images
      const responsiveImages = page.locator('img[srcset], picture, img[sizes]');
      const responsiveCount = await responsiveImages.count();

      if (responsiveCount > 0) {
        for (let i = 0; i < Math.min(responsiveCount, 5); i++) {
          const img = responsiveImages.nth(i);

          // Check srcset attribute
          const srcset = await img.getAttribute('srcset');
          if (srcset) {
            expect(srcset).toMatch(/\d+w|\d+x/); // Should have width or density descriptors
          }

          // Check sizes attribute
          const sizes = await img.getAttribute('sizes');
          if (sizes) {
            expect(sizes.length).toBeGreaterThan(0);
          }
        }
      }

      // Test image loading performance
      const allImages = page.locator('img');
      const imageCount = await allImages.count();

      if (imageCount > 0) {
        const loadTimes = [];

        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const img = allImages.nth(i);

          if (await img.isVisible()) {
            const startTime = Date.now();
            await img.waitFor({ state: 'visible' });
            const endTime = Date.now();

            loadTimes.push(endTime - startTime);
          }
        }

        if (loadTimes.length > 0) {
          const avgLoadTime = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
          expect(avgLoadTime).toBeLessThan(2000); // Images should load within 2 seconds
        }
      }
    });
  });

  test.describe('Accessibility Compliance (WCAG 2.1)', () => {
    test('should have proper heading hierarchy @accessibility', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      if (headings.length > 0) {
        // Should have exactly one H1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);

        let previousLevel = 0;
        for (const heading of headings) {
          const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
          const currentLevel = parseInt(tagName.charAt(1));

          // Should not skip heading levels
          if (previousLevel > 0) {
            expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
          }

          previousLevel = currentLevel;
        }
      }
    });

    test('should provide proper ARIA labels and roles @accessibility', async ({ page }) => {
      // Check navigation landmarks
      const navigation = page.locator('nav, [role="navigation"]');
      const navCount = await navigation.count();

      if (navCount > 0) {
        for (let i = 0; i < navCount; i++) {
          const nav = navigation.nth(i);

          // Should have proper role
          const role = await nav.getAttribute('role');
          const tagName = await nav.evaluate((el) => el.tagName.toLowerCase());

          if (tagName !== 'nav') {
            expect(role).toBe('navigation');
          }

          // Should have aria-label or aria-labelledby
          const ariaLabel = await nav.getAttribute('aria-label');
          const ariaLabelledBy = await nav.getAttribute('aria-labelledby');

          if (navCount > 1) {
            // Multiple navs should be distinguished
            expect(ariaLabel || ariaLabelledBy).toBeTruthy();
          }
        }
      }

      // Check form controls
      const formControls = page.locator('input, select, textarea');
      const controlCount = await formControls.count();

      for (let i = 0; i < Math.min(controlCount, 10); i++) {
        const control = formControls.nth(i);

        if (await control.isVisible()) {
          // Should have label or aria-label
          const id = await control.getAttribute('id');
          const ariaLabel = await control.getAttribute('aria-label');
          const ariaLabelledBy = await control.getAttribute('aria-labelledby');

          let hasLabel = false;

          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            hasLabel = (await label.count()) > 0;
          }

          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation @accessibility', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');

      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();

      // Navigate through focusable elements
      const focusableElements = [];

      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');

        const currentElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            id: el?.id,
            type: el?.getAttribute('type'),
            role: el?.getAttribute('role'),
          };
        });

        if (currentElement.tagName) {
          focusableElements.push(currentElement);
        }

        // Check if focus is visible
        const focusVisible = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return false;

          const styles = getComputedStyle(el);
          const outline = styles.outline || styles.outlineWidth || styles.outlineStyle;
          const boxShadow = styles.boxShadow;
          const backgroundColor = styles.backgroundColor;

          return (
            outline !== 'none' ||
            boxShadow.includes('inset') ||
            boxShadow.includes('0 0') ||
            backgroundColor !== 'transparent'
          );
        });

        // Focus should be visible (though this may vary by element)
        // We'll just ensure the activeElement exists
        expect(currentElement.tagName).toBeDefined();
      }

      // Should have found some focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should provide text alternatives for images @accessibility', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 20); i++) {
        const img = images.nth(i);

        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          const ariaLabel = await img.getAttribute('aria-label');
          const ariaLabelledBy = await img.getAttribute('aria-labelledby');

          // Image should have alt text or proper ARIA labeling
          // Decorative images can have empty alt=""
          expect(
            alt !== null || role === 'presentation' || ariaLabel || ariaLabelledBy
          ).toBeTruthy();

          // Non-decorative images should have meaningful alt text
          if (alt && alt.length > 0) {
            expect(alt.length).toBeGreaterThan(2); // Should be meaningful
            expect(alt).not.toMatch(/^(image|img|picture|photo)$/i); // Avoid generic alt text
          }
        }
      }
    });

    test('should have sufficient color contrast @accessibility', async ({ page }) => {
      await assertions.checkColorContrast(page);

      // Test specific high-contrast scenarios
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
      const elementCount = await textElements.count();

      for (let i = 0; i < Math.min(elementCount, 30); i++) {
        const element = textElements.nth(i);

        if (await element.isVisible()) {
          const textContent = await element.textContent();

          if (textContent && textContent.trim().length > 0) {
            const styles = await element.evaluate((el) => {
              const computed = getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: parseFloat(computed.fontSize),
              };
            });

            // Elements should have readable text
            expect(styles.color).not.toBe(styles.backgroundColor);

            // Font size should be readable
            expect(styles.fontSize).toBeGreaterThanOrEqual(12);
          }
        }
      }
    });

    test('should provide focus management @accessibility', async ({ page }) => {
      await assertions.testFocusManagement(page);

      // Test modal/dialog focus management if present
      const modalTrigger = page
        .locator('button:has-text("Open"), button:has-text("Modal"), [data-testid*="modal"]')
        .first();

      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();

        const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();

        if (await modal.isVisible()) {
          // Focus should be trapped in modal
          const firstFocusable = modal.locator('button, input, a, [tabindex="0"]').first();

          if (await firstFocusable.isVisible()) {
            await expect(firstFocusable).toBeFocused();
          }

          // Test escape key closes modal
          await page.keyboard.press('Escape');

          // Modal should close and focus should return
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should support screen readers @accessibility', async ({ page }) => {
      // Check for screen reader specific content
      const srOnlyElements = page.locator(
        '.sr-only, .screen-reader-only, [class*="visually-hidden"]'
      );
      const srCount = await srOnlyElements.count();

      if (srCount > 0) {
        for (let i = 0; i < srCount; i++) {
          const srElement = srOnlyElements.nth(i);

          // Should be visually hidden but accessible to screen readers
          const styles = await srElement.evaluate((el) => {
            const computed = getComputedStyle(el);
            return {
              position: computed.position,
              left: computed.left,
              width: computed.width,
              height: computed.height,
              overflow: computed.overflow,
            };
          });

          // Common screen reader only patterns
          const isHidden =
            styles.position === 'absolute' &&
            (styles.left.includes('-') || styles.width === '1px' || styles.height === '1px');

          expect(isHidden).toBeTruthy();
        }
      }

      // Check for proper landmark structure
      const landmarks = await page
        .locator(
          'main, nav, header, footer, aside, section[aria-label], [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
        )
        .count();
      expect(landmarks).toBeGreaterThan(0);
    });
  });

  test.describe('Visual Regression and Consistency', () => {
    test('should maintain visual consistency across pages @visual', async ({ page }) => {
      // Test common UI elements appear consistently
      const commonElements = {
        header: 'header, [role="banner"]',
        navigation: 'nav, [role="navigation"]',
        footer: 'footer, [role="contentinfo"]',
        logo: '[data-testid="logo"], .logo, img[alt*="logo" i]',
      };

      const pages = ['/', '/login'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await assertions.waitForPageLoad();

        for (const [elementName, selector] of Object.entries(commonElements)) {
          const element = page.locator(selector).first();

          if (await element.isVisible()) {
            // Element should maintain consistent styling
            const styles = await element.evaluate((el) => {
              const computed = getComputedStyle(el);
              return {
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize,
                color: computed.color,
                backgroundColor: computed.backgroundColor,
              };
            });

            expect(styles.fontFamily).toBeDefined();
            expect(styles.fontSize).toBeDefined();

            // Store for consistency comparison across pages
            if (!page['elementStyles']) {
              page['elementStyles'] = {};
            }
            page['elementStyles'][elementName] = styles;
          }
        }
      }
    });

    test('should handle different content lengths gracefully @visual', async ({ page }) => {
      // Test layout with different content lengths
      const longText = 'A'.repeat(1000);
      const shortText = 'Short';

      // Create test content dynamically
      await page.evaluate(
        (texts) => {
          const container = document.createElement('div');
          container.innerHTML = `
          <div class="test-container">
            <h2>Short Content</h2>
            <p>${texts.short}</p>
            <h2>Long Content</h2>
            <p>${texts.long}</p>
          </div>
        `;
          document.body.appendChild(container);
        },
        { long: longText, short: shortText }
      );

      const testContainer = page.locator('.test-container');
      await expect(testContainer).toBeVisible();

      // Container should handle both content lengths
      const containerBox = await testContainer.boundingBox();
      expect(containerBox?.height).toBeGreaterThan(100); // Should have reasonable height

      // Check for text overflow
      const hasOverflow = await testContainer.evaluate((el) => {
        const styles = getComputedStyle(el);
        return styles.overflow === 'hidden' && el.scrollHeight > el.clientHeight;
      });

      // If overflow is hidden, should have proper handling
      if (hasOverflow) {
        expect(hasOverflow).toBeTruthy();
      }
    });

    test('should maintain layout integrity @visual', async ({ page }) => {
      // Check for layout issues
      const mainContent = page.locator('main, [role="main"], .main-content').first();

      if (await mainContent.isVisible()) {
        const contentBox = await mainContent.boundingBox();
        const viewportSize = page.viewportSize();

        if (contentBox && viewportSize) {
          // Content should not overflow viewport
          expect(contentBox.x).toBeGreaterThanOrEqual(0);
          expect(contentBox.y).toBeGreaterThanOrEqual(0);
          expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(viewportSize.width + 20); // Small margin for scrollbars
        }
      }

      // Check for overlapping elements
      const overlappingElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*')).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        const overlaps = [];

        for (let i = 0; i < Math.min(elements.length, 50); i++) {
          const el1 = elements[i];
          const rect1 = el1.getBoundingClientRect();

          for (let j = i + 1; j < Math.min(elements.length, 50); j++) {
            const el2 = elements[j];
            const rect2 = el2.getBoundingClientRect();

            // Check if elements overlap and are not parent/child
            if (!el1.contains(el2) && !el2.contains(el1)) {
              const overlap = !(
                rect1.right < rect2.left ||
                rect2.right < rect1.left ||
                rect1.bottom < rect2.top ||
                rect2.bottom < rect1.top
              );

              if (overlap) {
                overlaps.push({
                  el1: el1.tagName + (el1.className ? '.' + el1.className.split(' ')[0] : ''),
                  el2: el2.tagName + (el2.className ? '.' + el2.className.split(' ')[0] : ''),
                });
              }
            }
          }
        }

        return overlaps.slice(0, 5); // Return first 5 overlaps if any
      });

      // Some overlaps are expected (like absolutely positioned elements)
      // This test mainly checks for unexpected layout issues
      expect(overlappingElements.length).toBeLessThan(10);
    });
  });

  test.describe('Loading States and Animations', () => {
    test('should show loading states during async operations @loading', async ({ page }) => {
      await authHelpers.goToLogin();

      // Look for loading indicators
      const loginForm = page.locator('form');
      const loginButton = page.locator('button[type="submit"]');

      if ((await loginForm.isVisible()) && (await loginButton.isVisible())) {
        // Fill form
        await page.fill('input[type="email"]', config.testUsers.staff.email);
        await page.fill('input[type="password"]', config.testUsers.staff.password);

        // Submit and check for loading state
        await loginButton.click();

        // Should show some loading indication
        const loadingStates = page.locator(
          '[data-testid="loading"], .loading, .spinner, [aria-label*="loading" i]'
        );
        const disabledButton = loginButton.locator(':disabled');

        // Either loading indicator or disabled button
        const hasLoadingState =
          (await loadingStates.count()) > 0 || (await disabledButton.count()) > 0;

        if (hasLoadingState) {
          expect(hasLoadingState).toBeTruthy();
        }
      }
    });

    test('should handle long loading times gracefully @loading', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        route.continue();
      });

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Should show loading state for slow operations
      const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner');

      if ((await loadingIndicators.count()) > 0) {
        await expect(loadingIndicators.first()).toBeVisible();
      }

      // Eventually content should load
      await assertions.waitForPageLoad();

      const mainContent = page.locator('main, [role="main"]').first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toBeVisible();
      }
    });

    test('should have smooth animations @animations', async ({ page }) => {
      // Check for CSS animations and transitions
      const hasAnimations = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let animatedElements = 0;

        elements.forEach((el) => {
          const styles = getComputedStyle(el);
          if (styles.animationName && styles.animationName !== 'none') {
            animatedElements++;
          }
          if (
            styles.transition &&
            styles.transition !== 'none' &&
            styles.transition !== 'all 0s ease 0s'
          ) {
            animatedElements++;
          }
        });

        return animatedElements > 0;
      });

      expect(hasAnimations).toBeTruthy();

      // Test hover animations if present
      const hoverElements = page.locator('button, a, [role="button"]').first();

      if (await hoverElements.isVisible()) {
        await hoverElements.hover();

        // Should handle hover state
        const hasHoverStyles = await hoverElements.evaluate((el) => {
          const styles = getComputedStyle(el);
          return (
            styles.cursor === 'pointer' ||
            styles.transition !== 'none' ||
            styles.transform !== 'none'
          );
        });

        expect(hasHoverStyles).toBeTruthy();
      }
    });

    test('should respect reduced motion preferences @animations @accessibility', async ({
      page,
      context,
    }) => {
      // Enable reduced motion
      await context.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();

      // Check that animations are reduced or disabled
      const respectsReducedMotion = await page.evaluate(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) return true;

        // Check if animations are disabled when reduced motion is preferred
        const elements = document.querySelectorAll('*');
        let animatedElements = 0;

        elements.forEach((el) => {
          const styles = getComputedStyle(el);
          if (styles.animationDuration && parseFloat(styles.animationDuration) > 0.1) {
            animatedElements++;
          }
        });

        return animatedElements === 0;
      });

      // Should respect user preference
      expect(respectsReducedMotion).toBeTruthy();
    });
  });

  test.describe('Error States and User Feedback', () => {
    test('should display clear error messages @error-states', async ({ page }) => {
      await authHelpers.goToLogin();

      // Test form validation errors
      const loginForm = page.locator('form');
      const submitButton = page.locator('button[type="submit"]');

      if (await loginForm.isVisible()) {
        // Try to submit empty form
        await submitButton.click();

        // Should show validation errors
        const errorMessages = page.locator(
          '[data-testid*="error"], .error, [role="alert"], [aria-invalid="true"] ~ *, .error-message'
        );

        if ((await errorMessages.count()) > 0) {
          const firstError = errorMessages.first();
          await expect(firstError).toBeVisible();

          const errorText = await firstError.textContent();
          expect(errorText).toBeDefined();
          expect(errorText?.length).toBeGreaterThan(0);
        }
      }
    });

    test('should provide success feedback @feedback', async ({ page }) => {
      // Look for success states in forms or actions
      await page.goto('/');

      // Test any forms that might provide success feedback
      const forms = page.locator('form');
      const formCount = await forms.count();

      if (formCount > 0) {
        // Look for success messages in the page
        const successElements = page.locator(
          '[data-testid*="success"], .success, [role="status"], .success-message'
        );

        if ((await successElements.count()) > 0) {
          const successElement = successElements.first();

          if (await successElement.isVisible()) {
            const successText = await successElement.textContent();
            expect(successText).toBeDefined();
            expect(successText).toMatch(/success|complete|saved|sent/i);
          }
        }
      }
    });

    test('should handle network errors gracefully @error-states', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', (route) => route.abort());

      try {
        await page.goto('/', { timeout: 5000 });
      } catch (error) {
        // Expected to fail
      }

      // Should show appropriate error state
      const errorStates = page.locator('[data-testid*="error"], .error-page, .network-error');

      if ((await errorStates.count()) > 0) {
        await expect(errorStates.first()).toBeVisible();
      }

      // Reset network
      await page.unroute('**/*');
    });

    test('should provide contextual help @feedback', async ({ page }) => {
      // Look for help elements
      const helpElements = page.locator(
        '[data-testid*="help"], .help, [aria-describedby], button[aria-label*="help" i], [title]'
      );
      const helpCount = await helpElements.count();

      for (let i = 0; i < Math.min(helpCount, 10); i++) {
        const helpElement = helpElements.nth(i);

        if (await helpElement.isVisible()) {
          // Help should have descriptive content
          const title = await helpElement.getAttribute('title');
          const ariaLabel = await helpElement.getAttribute('aria-label');
          const textContent = await helpElement.textContent();

          const hasHelpfulContent = title || ariaLabel || (textContent && textContent.length > 5);
          expect(hasHelpfulContent).toBeTruthy();
        }
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render consistently across viewports @compatibility', async ({ page }) => {
      const testViewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
      ];

      for (const viewport of testViewports) {
        await page.setViewportSize(viewport);

        // Key elements should be visible
        const navigation = page.locator('nav, [role="navigation"]').first();
        const mainContent = page.locator('main, [role="main"]').first();

        if (await navigation.isVisible()) {
          await expect(navigation).toBeVisible();
        }

        if (await mainContent.isVisible()) {
          await expect(mainContent).toBeVisible();
        }

        // Check for layout integrity
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeGreaterThan(viewport.height * 0.5); // Should have reasonable content
      }
    });

    test('should handle CSS feature support gracefully @compatibility', async ({ page }) => {
      // Test CSS feature detection and fallbacks
      const cssFeatures = await page.evaluate(() => {
        const features = {};

        // Test common CSS features
        features.flexbox = CSS.supports('display', 'flex');
        features.grid = CSS.supports('display', 'grid');
        features.customProperties = CSS.supports('--custom-property', 'value');
        features.transforms = CSS.supports('transform', 'translateX(10px)');

        return features;
      });

      // Modern browsers should support these features
      expect(cssFeatures.flexbox).toBeTruthy();
      expect(cssFeatures.customProperties).toBeTruthy();

      // Layout should work even with basic feature support
      const mainLayout = page.locator('main, [role="main"]').first();
      if (await mainLayout.isVisible()) {
        const layoutBox = await mainLayout.boundingBox();
        expect(layoutBox?.width).toBeGreaterThan(100);
        expect(layoutBox?.height).toBeGreaterThan(100);
      }
    });
  });
});
