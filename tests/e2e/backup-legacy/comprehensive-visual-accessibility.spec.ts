import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Visual Regression and Accessibility Tests', () => {
  test.describe('Visual Regression Testing', () => {
    test('homepage visual consistency across themes', async ({ page }) => {
      await page.goto('/');
      
      // Light theme screenshot
      await page.screenshot({ path: 'test-results/visual/homepage-light.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Toggle to dark theme
      const themeToggle = page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])').first();
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(1000);
        
        // Dark theme screenshot
        await page.screenshot({ path: 'test-results/visual/homepage-dark.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Toggle back to light
        await themeToggle.click();
        await page.waitForTimeout(1000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('login page visual consistency', async ({ page }) => {
      await page.goto('/login');
      
      // Light theme
      await page.screenshot({ path: 'test-results/visual/login-light.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Dark theme
      const themeToggle = page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])').first();
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/visual/login-dark.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('staff dashboard visual consistency', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Overview tab
      await page.screenshot({ path: 'test-results/visual/staff-overview.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Packages tab
      await page.click('button:has-text("packages")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/staff-packages.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Customers tab
      await page.click('button:has-text("customers")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/staff-customers.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Loads tab
      await page.click('button:has-text("loads")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/staff-loads.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('customer portal visual consistency', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Customer")');
      await page.waitForURL('/portal');
      await page.waitForTimeout(2000);
      
      // Main dashboard
      await page.screenshot({ path: 'test-results/visual/customer-dashboard.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Invoices tab
      await page.click('button:has-text("Invoices")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/customer-invoices.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Account tab
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/customer-account.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('admin dashboard visual consistency', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Admin")');
      await page.waitForURL('/admin');
      await page.waitForTimeout(2000);
      
      // Overview tab
      await page.screenshot({ path: 'test-results/visual/admin-overview.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Test other tabs
      const tabs = ['analytics', 'operations', 'finance', 'system'];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `test-results/visual/admin-${tab}.png`, fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('driver portal visual consistency', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Driver")');
      await page.waitForURL('/driver');
      await page.waitForTimeout(2000);
      
      // Main driver interface
      await page.screenshot({ path: 'test-results/visual/driver-dashboard.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Test modals if they open
      const manifestButton = page.locator('button:has-text("View Manifest")');
      
      if (await manifestButton.isVisible()) {
        await manifestButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/visual/driver-manifest-modal.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Close modal
        const closeButton = page.locator('button:has(svg)').last();
        await closeButton.click();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('documentation site visual consistency', async ({ page }) => {
      await page.goto('/docs');
      
      // Main docs page
      await page.screenshot({ path: 'test-results/visual/docs-homepage.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // API docs page
      await page.goto('/docs/api');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/docs-api.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Business docs page
      await page.goto('/docs/business');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual/docs-business.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('responsive design visual consistency', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];
      
      const pages = [
        { url: '/', name: 'homepage' },
        { url: '/login', name: 'login' },
        { url: '/docs', name: 'docs' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        for (const pageInfo of pages) {
          await page.goto(pageInfo.url);
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: `test-results/visual/${pageInfo.name}-${viewport.name}.png`, 
            fullPage: true 
          });
    } catch (error) {
      // Ignore localStorage access errors
    }
        }
      }
      
      // Test authenticated pages on mobile
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Staff mobile
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/visual/staff-mobile.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Customer mobile
      await page.goto('/login');
      await page.click('button:has-text("Customer")');
      await page.waitForURL('/portal');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/visual/customer-mobile.png', fullPage: true });
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

  test.describe('Accessibility Testing', () => {
    test('homepage accessibility compliance', async ({ page }) => {
      await page.goto('/');
      
      // Check page title
      await expect(page).toHaveTitle(/Shipnorth/);
      
      // Check main heading
      const mainHeading = page.locator('h1, h2').first();
      await expect(mainHeading).toBeVisible();
      
      // Check that images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const altText = await img.getAttribute('alt');
        // Alt text can be empty for decorative images, but should be defined
        expect(altText).toBeDefined();
      }
      
      // Check link accessibility
      const links = page.locator('a');
      const linkCount = await links.count();
      
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Links should have accessible text
        const hasAccessibleText = (linkText && linkText.trim() !== '') || ariaLabel || title;
        expect(hasAccessibleText).toBe(true);
      }
      
      // Check form labels
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const label = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const associatedLabel = await page.locator(`label[for="${await input.getAttribute('id')}"]`).count();
        
        // Inputs should have labels
        const hasLabel = label || placeholder || associatedLabel > 0;
        if (!hasLabel) {
          const inputType = await input.getAttribute('type');
          console.log(`⚠️ Input without label: type="${inputType}"`);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('login page accessibility compliance', async ({ page }) => {
      await page.goto('/login');
      
      // Check form structure
      const form = page.locator('form').first();
      
      if (await form.count() > 0) {
        // Check form inputs have proper labels
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        
        if (await emailInput.count() > 0) {
          const emailLabel = await emailInput.getAttribute('aria-label') || 
                            await page.locator('label[for*="email"]').count() > 0;
          expect(emailLabel).toBeTruthy();
        }
        
        if (await passwordInput.count() > 0) {
          const passwordLabel = await passwordInput.getAttribute('aria-label') ||
                               await page.locator('label[for*="password"]').count() > 0;
          expect(passwordLabel).toBeTruthy();
        }
      }
      
      // Check button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Buttons should have accessible text
        const hasAccessibleText = (buttonText && buttonText.trim() !== '') || ariaLabel || title;
        expect(hasAccessibleText).toBe(true);
      }
      
      // Check color contrast (basic check - would need external tool for full compliance)
      const bodyStyles = await page.locator('body').evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      expect(bodyStyles.color).toBeTruthy();
      expect(bodyStyles.backgroundColor).toBeTruthy();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('keyboard navigation works throughout application', async ({ page }) => {
      const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/login', name: 'Login' },
        { url: '/docs', name: 'Documentation' }
      ];
      
      for (const testPage of testPages) {
        await page.goto(testPage.url);
        await page.waitForTimeout(1000);
        
        // Test Tab navigation
        let tabCount = 0;
        const maxTabs = 10;
        
        for (let i = 0; i < maxTabs; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const focusedElement = page.locator(':focus');
          const hasFocus = await focusedElement.count() > 0;
          
          if (hasFocus) {
            tabCount++;
            const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
            const isInteractive = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
            
            if (isInteractive) {
              console.log(`✅ ${testPage.name}: Tab ${i + 1} - ${tagName} focusable`);
            }
          }
        }
        
        expect(tabCount).toBeGreaterThan(0);
        console.log(`${testPage.name}: ${tabCount} focusable elements found`);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('screen reader support - ARIA attributes', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Check for ARIA landmarks
      const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
      const landmarkCount = await landmarks.count();
      
      if (landmarkCount > 0) {
        console.log(`✅ Found ${landmarkCount} ARIA landmarks`);
      }
      
      // Check for proper heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        console.log(`✅ Found ${headingCount} headings for proper structure`);
        
        // Check if there's at least one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThan(0);
      }
      
      // Check for button roles and states
      const buttons = page.locator('[role="button"], button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaExpanded = await button.getAttribute('aria-expanded');
        const ariaPressed = await button.getAttribute('aria-pressed');
        const disabled = await button.getAttribute('disabled');
        const ariaDisabled = await button.getAttribute('aria-disabled');
        
        // Check for proper button states
        if (ariaExpanded !== null) {
          expect(['true', 'false'].includes(ariaExpanded)).toBe(true);
        }
        
        if (ariaPressed !== null) {
          expect(['true', 'false'].includes(ariaPressed)).toBe(true);
        }
      }
      
      // Check for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();
      
      console.log(`Found ${liveRegionCount} live regions for dynamic content`);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('focus management in modals and navigation', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Driver")');
      await page.waitForURL('/driver');
      await page.waitForTimeout(2000);
      
      // Test modal focus management
      const manifestButton = page.locator('button:has-text("View Manifest")');
      
      if (await manifestButton.isVisible()) {
        // Open modal
        await manifestButton.click();
        await page.waitForTimeout(1000);
        
        // Focus should be trapped in modal
        const modalElement = page.locator('[role="dialog"], .modal').first();
        
        if (await modalElement.count() > 0) {
          // Check initial focus
          const focusedElement = page.locator(':focus');
          const initialFocus = await focusedElement.count() > 0;
          
          if (initialFocus) {
            console.log('✅ Modal receives initial focus');
          }
          
          // Test focus trap by pressing Tab
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
            
            const currentFocus = page.locator(':focus');
            const focusWithinModal = await modalElement.locator(':focus').count() > 0;
            
            if (!focusWithinModal) {
              console.log('⚠️ Focus escaped modal during tab navigation');
              break;
            }
          }
          
          // Close modal with Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          // Focus should return to trigger
          const finalFocus = page.locator(':focus');
          const focusReturned = await finalFocus.count() > 0;
          
          if (focusReturned) {
            console.log('✅ Focus returned after modal close');
          }
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('color contrast and visual accessibility', async ({ page }) => {
      const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/login', name: 'Login' }
      ];
      
      for (const testPage of testPages) {
        await page.goto(testPage.url);
        await page.waitForTimeout(1000);
        
        // Check text elements for basic contrast
        const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        const textCount = await textElements.count();
        
        let contrastIssues = 0;
        
        for (let i = 0; i < Math.min(textCount, 20); i++) {
          const element = textElements.nth(i);
          
          try {
            const styles = await element.evaluate(el => {
              const computed = getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize
              };
            });
    } catch (error) {
      // Ignore localStorage access errors
    }
            
            // Basic check for transparent backgrounds or missing colors
            if (styles.color === 'rgba(0, 0, 0, 0)' || styles.color === 'transparent') {
              contrastIssues++;
            }
            
            // Check font size for readability
            const fontSize = parseInt(styles.fontSize);
            if (fontSize < 12) {
              console.log(`⚠️ Small font size detected: ${fontSize}px`);
            }
            
          } catch (error) {
            // Skip elements that can't be evaluated
          }
        }
        
        console.log(`${testPage.name}: ${contrastIssues} potential contrast issues out of ${Math.min(textCount, 20)} elements checked`);
      }
      
      // Test theme toggle accessibility
      await page.goto('/');
      const themeToggle = page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])').first();
      
      if (await themeToggle.isVisible()) {
        // Check theme toggle has accessible label
        const ariaLabel = await themeToggle.getAttribute('aria-label');
        const title = await themeToggle.getAttribute('title');
        
        const hasAccessibleLabel = ariaLabel || title;
        expect(hasAccessibleLabel).toBeTruthy();
        
        console.log('✅ Theme toggle has accessible labeling');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('form validation accessibility', async ({ page }) => {
      await page.goto('/login');
      
      // Test form validation messages
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      if (await submitButton.count() > 0) {
        // Try submitting empty form
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Check for validation messages
        const errorMessages = page.locator('[aria-invalid="true"], .error, [role="alert"]');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          // Validation messages should be accessible
          for (let i = 0; i < errorCount; i++) {
            const error = errorMessages.nth(i);
            const errorText = await error.textContent();
            const hasAriaRole = await error.getAttribute('role');
            
            expect(errorText).toBeTruthy();
            console.log(`✅ Validation error accessible: "${errorText}"`);
          }
        }
        
        // Fill invalid email and check validation
        if (await emailInput.count() > 0) {
          await emailInput.fill('invalid-email');
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Check if email input is marked as invalid
          const isInvalid = await emailInput.getAttribute('aria-invalid');
          const hasError = await page.locator('[aria-describedby*="error"]').count() > 0;
          
          if (isInvalid === 'true' || hasError) {
            console.log('✅ Email validation properly marked as invalid');
          }
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

  test.describe('Performance Testing', () => {
    test('page load performance', async ({ page }) => {
      const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/login', name: 'Login' },
        { url: '/docs', name: 'Documentation' }
      ];
      
      for (const testPage of testPages) {
        const startTime = Date.now();
        
        await page.goto(testPage.url);
        await page.waitForLoadState('domcontentloaded');
        
        const domLoadTime = Date.now() - startTime;
        
        await page.waitForLoadState('networkidle');
        const fullLoadTime = Date.now() - startTime;
        
        console.log(`${testPage.name} - DOM: ${domLoadTime}ms, Full: ${fullLoadTime}ms`);
        
        // Performance thresholds
        expect(domLoadTime).toBeLessThan(3000); // DOM should load within 3s
        expect(fullLoadTime).toBeLessThan(8000); // Full page should load within 8s
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('authenticated page performance', async ({ page }) => {
      const authPages = [
        { user: 'Staff', url: '/staff', name: 'Staff Dashboard' },
        { user: 'Customer', url: '/portal', name: 'Customer Portal' },
        { user: 'Admin', url: '/admin', name: 'Admin Dashboard' }
      ];
      
      for (const authPage of authPages) {
        // Login first
        const loginStart = Date.now();
        
        await page.goto('/login');
        await page.click(`button:has-text("${authPage.user}")`);
        await page.waitForURL(authPage.url);
        
        const authTime = Date.now() - loginStart;
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        const fullLoadTime = Date.now() - loginStart;
        
        console.log(`${authPage.name} - Auth: ${authTime}ms, Full: ${fullLoadTime}ms`);
        
        // Authentication and page load should be reasonable
        expect(authTime).toBeLessThan(5000);
        expect(fullLoadTime).toBeLessThan(10000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('interaction responsiveness', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Test tab switching responsiveness
      const tabs = ['packages', 'customers', 'loads'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
        
        const switchTime = Date.now() - startTime;
        console.log(`Tab switch to ${tab}: ${switchTime}ms`);
        
        // Tab switches should be fast
        expect(switchTime).toBeLessThan(2000);
      }
      
      // Test search responsiveness if available
      const searchInputs = page.locator('input[type="search"], input[placeholder*="search"]');
      const searchCount = await searchInputs.count();
      
      if (searchCount > 0) {
        const searchInput = searchInputs.first();
        
        if (await searchInput.isVisible() && !(await searchInput.getAttribute('readonly'))) {
          const startTime = Date.now();
          
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
          
          const searchTime = Date.now() - startTime;
          console.log(`Search response time: ${searchTime}ms`);
          
          // Search should respond quickly
          expect(searchTime).toBeLessThan(3000);
          
          // Clear search
          await searchInput.fill('');
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('memory usage and resource efficiency', async ({ page }) => {
      await page.goto('/');
      
      // Monitor JavaScript heap size
      const initialHeapSize = try {
      await page.evaluate(() => {
        // @ts-ignore - performance.memory might not be available in all environments
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Navigate through several pages
      const navigationPath = ['/login', '/docs', '/', '/login'];
      
      for (const path of navigationPath) {
        await page.goto(path);
        await page.waitForTimeout(1000);
      }
      
      // Check final heap size
      const finalHeapSize = try {
      await page.evaluate(() => {
        // @ts-ignore
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      if (initialHeapSize > 0 && finalHeapSize > 0) {
        const heapIncrease = finalHeapSize - initialHeapSize;
        const increasePercent = (heapIncrease / initialHeapSize) * 100;
        
        console.log(`Memory usage - Initial: ${Math.round(initialHeapSize / 1024 / 1024)}MB, Final: ${Math.round(finalHeapSize / 1024 / 1024)}MB, Increase: ${Math.round(increasePercent)}%`);
        
        // Memory increase should be reasonable
        expect(increasePercent).toBeLessThan(200); // Less than 200% increase
      }
      
      // Check for excessive DOM nodes
      const domNodeCount = try {
      await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      console.log(`DOM node count: ${domNodeCount}`);
      
      // Should not have excessive DOM nodes
      expect(domNodeCount).toBeLessThan(5000);
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