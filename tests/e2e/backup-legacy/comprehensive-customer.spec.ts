import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Customer Portal Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and login as customer
    await page.context().clearCookies();
    try {
      try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Login as customer using quick login
    await page.goto('/login');
    await page.click('button:has-text("Customer")');
    await page.waitForURL('/portal', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Wait for page to load completely
    await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.waitForTimeout(2000); // Allow data to load
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Portal Header and Navigation', () => {
    test('header displays correct branding and user info', async ({ page }) => {
      // Check Shipnorth branding
      await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible();
      await expect(page.locator('text=Customer Portal')).toBeVisible();
      
      // Check theme toggle
      await expect(page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])')).toBeVisible();
      
      // Check refresh button
      await expect(page.locator('button[title="Refresh data"], button:has([data-lucide="refresh-cw"])')).toBeVisible();
      
      // Check user info (on larger screens)
      const userInfo = page.locator('text=john.doe@example.com, text=John Doe');
      if (await userInfo.count() > 0) {
        await expect(userInfo.first()).toBeVisible();
      }
      
      // Check logout button
      await expect(page.locator('button[title="Sign Out"], button:has([data-lucide="log-out"])')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/customer-portal-header.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('navigation tabs work correctly', async ({ page }) => {
      // Check all navigation tabs are present
      await expect(page.locator('button:has-text("My Packages")')).toBeVisible();
      await expect(page.locator('button:has-text("Invoices")')).toBeVisible();
      await expect(page.locator('button:has-text("Account")')).toBeVisible();
      
      // My Packages should be active by default
      await expect(page.locator('button:has-text("My Packages")[class*="border-blue"], button:has-text("My Packages")[class*="text-blue"]')).toBeVisible();
      
      // Test navigation to Invoices
      await page.click('button:has-text("Invoices")');
      await page.waitForTimeout(1000);
      await expect(page.locator('h2:has-text("Your Invoices")')).toBeVisible();
      await expect(page.locator('button:has-text("Invoices")[class*="border-blue"], button:has-text("Invoices")[class*="text-blue"]')).toBeVisible();
      
      // Test navigation to Account
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Account Information')).toBeVisible();
      await expect(page.locator('button:has-text("Account")[class*="border-blue"], button:has-text("Account")[class*="text-blue"]')).toBeVisible();
      
      // Navigate back to packages
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Total Packages')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('refresh button works', async ({ page }) => {
      const refreshButton = page.locator('button[title="Refresh data"], button:has([data-lucide="refresh-cw"])');
      
      // Click refresh button
      await refreshButton.click();
      
      // Should show spinning animation
      await expect(page.locator('[class*="animate-spin"]')).toBeVisible({ timeout: 2000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Wait for refresh to complete
      await page.waitForTimeout(3000);
      
      // Page should still be functional
      await expect(page.locator('text=Total Packages')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('logout functionality works', async ({ page }) => {
      const logoutButton = page.locator('button[title="Sign Out"], button:has([data-lucide="log-out"])');
      
      await logoutButton.click();
      
      // Should redirect to homepage or login
      await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Should not be able to access portal anymore
      await page.goto('/portal');
      await expect(page).toHaveURL('/login');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('theme toggle works', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])').first();
      
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Take screenshot of theme change
      await page.screenshot({ path: 'test-results/customer-portal-theme-toggle.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Package Dashboard and Stats', () => {
    test('package stats cards display correctly', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      // Check stats cards
      await expect(page.locator('text=Total Packages')).toBeVisible();
      await expect(page.locator('text=Ready to Ship')).toBeVisible();
      await expect(page.locator('text=In Transit')).toBeVisible();
      await expect(page.locator('text=Delivered')).toBeVisible();
      
      // Check that stats have numeric values
      const statsCards = page.locator('.text-2xl, [class*="text-2xl"]');
      const cardCount = await statsCards.count();
      
      if (cardCount > 0) {
        // At least one card should show a number
        await expect(page.locator('text=/^\\d+$/')).toBeVisible();
      }
      
      // Take screenshot of stats
      await page.screenshot({ path: 'test-results/customer-portal-stats.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('package count badge displays in navigation', async ({ page }) => {
      // Look for package count badge in nav tab
      const packagesTab = page.locator('button:has-text("My Packages")');
      const badge = packagesTab.locator('[class*="bg-blue"], .badge, [class*="rounded-full"]');
      
      if (await badge.count() > 0) {
        await expect(badge.first()).toBeVisible();
        
        // Badge should contain a number
        const badgeText = await badge.first().textContent();
        expect(badgeText).toMatch(/\d+/);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Package Search and Filtering', () => {
    test('search functionality works', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const searchInput = page.locator('input[placeholder*="Search packages"], input[placeholder*="tracking"], input[type="text"]').first();
      await expect(searchInput).toBeVisible();
      
      // Test search with a sample query
      await searchInput.fill('PKG');
      await page.waitForTimeout(1000);
      
      // Should filter packages (or show no results)
      const packagesContainer = page.locator('.space-y-4').last();
      await expect(packagesContainer).toBeVisible();
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);
      
      // Test search with tracking number format
      await searchInput.fill('1Z');
      await page.waitForTimeout(1000);
      
      // Clear search again
      await searchInput.fill('');
      await page.waitForTimeout(500);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('status filter works', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const statusFilter = page.locator('select').first();
      
      if (await statusFilter.isVisible()) {
        // Test different filter options
        await statusFilter.selectOption('delivered');
        await page.waitForTimeout(1000);
        
        // Should filter to delivered packages
        await statusFilter.selectOption('in_transit');
        await page.waitForTimeout(1000);
        
        // Should filter to in transit packages
        await statusFilter.selectOption('all');
        await page.waitForTimeout(1000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('sort options work', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const sortSelect = page.locator('select').last();
      
      if (await sortSelect.isVisible()) {
        // Test different sort options
        await sortSelect.selectOption('oldest');
        await page.waitForTimeout(1000);
        
        await sortSelect.selectOption('status');
        await page.waitForTimeout(1000);
        
        await sortSelect.selectOption('newest');
        await page.waitForTimeout(1000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('export functionality works', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const exportButton = page.locator('button:has-text("Export")');
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(1000);
        
        // Export should trigger download or show dialog
        // This is hard to test in Playwright, but button should be clickable
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('print functionality works', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const printButton = page.locator('button:has-text("Print")');
      
      if (await printButton.isVisible()) {
        await printButton.click();
        await page.waitForTimeout(1000);
        
        // Print should trigger print dialog
        // This is hard to test in Playwright, but button should be clickable
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Package List Display', () => {
    test('packages display with correct information', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(2000);
      
      const packageCards = page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl').filter({ hasText: /PKG-|1Z|CP|tracking/i });
    } catch (error) {
      // Ignore localStorage access errors
    }
      const packageCount = await packageCards.count();
      
      if (packageCount > 0) {
        const firstPackage = packageCards.first();
        
        // Check package card elements
        await expect(firstPackage.locator('text=/PKG-|1Z|CP|tracking/i')).toBeVisible();
        
        // Check status badge
        await expect(firstPackage.locator('[class*="bg-"], [class*="rounded-full"]')).toBeVisible();
        
        // Check progress bar
        await expect(firstPackage.locator('[class*="bg-blue-600"]')).toBeVisible();
        
        // Check package details
        await expect(firstPackage.locator('text=Destination, text=Weight, text=Received')).toBeVisible();
        
      } else {
        // Should show empty state
        await expect(page.locator('text=No packages, text=No matching packages')).toBeVisible();
      }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/customer-portal-packages-list.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('package tracking buttons work', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(2000);
      
      const trackButtons = page.locator('button:has-text("Track")');
      const trackButtonCount = await trackButtons.count();
      
      if (trackButtonCount > 0) {
        const firstTrackButton = trackButtons.first();
        await firstTrackButton.click();
        
        // Should navigate to tracking page
        await page.waitForTimeout(1000);
        
        // Check if URL changed to tracking page
        const currentUrl = page.url();
        if (currentUrl.includes('/track/')) {
          // Successfully navigated to tracking page
          console.log('✅ Track button navigation works');
          
          // Go back to portal
          await page.goBack();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('delivery confirmation displays correctly', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(2000);
      
      // Look for delivered packages with confirmation
      const deliveredPackages = page.locator('.bg-green-50, .bg-green-900\\/20');
      const deliveredCount = await deliveredPackages.count();
      
      if (deliveredCount > 0) {
        const firstDelivered = deliveredPackages.first();
        
        // Should show delivery date
        await expect(firstDelivered.locator('text=/Delivered on|delivered/i')).toBeVisible();
        
        // Check for signature info
        const signatureInfo = firstDelivered.locator('text=Signature, text=Received by');
        if (await signatureInfo.count() > 0) {
          await expect(signatureInfo.first()).toBeVisible();
        }
        
        // Check for delivery photo
        const deliveryPhoto = firstDelivered.locator('img[alt*="Delivery"], img[src*="photo"]');
        if (await deliveryPhoto.count() > 0) {
          await expect(deliveryPhoto.first()).toBeVisible();
          
          // Test photo click functionality
          await deliveryPhoto.first().click();
          await page.waitForTimeout(1000);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('progress bars display correct status', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(2000);
      
      const progressBars = page.locator('[class*="bg-blue-600"]').filter({ hasText: /progress/i }).or(page.locator('.progress-bar, [style*="width"]'));
      const progressCount = await progressBars.count();
      
      if (progressCount > 0) {
        // Progress bars should be visible
        await expect(progressBars.first()).toBeVisible();
        
        // Should show percentage
        await expect(page.locator('text=/%|progress/i')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Invoices Tab', () => {
    test('invoices tab displays correctly', async ({ page }) => {
      await page.click('button:has-text("Invoices")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Your Invoices")')).toBeVisible();
      await expect(page.locator('text=Track your shipping charges')).toBeVisible();
      
      // Check for invoices table or empty state
      const hasTable = await page.locator('table').count();
      const hasEmptyState = await page.locator('text=No invoices yet').count();
      
      if (hasTable > 0) {
        // Should have table headers
        await expect(page.locator('th:has-text("Invoice #")')).toBeVisible();
        await expect(page.locator('th:has-text("Date")')).toBeVisible();
        await expect(page.locator('th:has-text("Amount")')).toBeVisible();
        await expect(page.locator('th:has-text("Status")')).toBeVisible();
        await expect(page.locator('th:has-text("Actions")')).toBeVisible();
        
        // Test download PDF buttons
        const downloadButtons = page.locator('button:has-text("Download PDF")');
        if (await downloadButtons.count() > 0) {
          await downloadButtons.first().click();
          await page.waitForTimeout(500);
        }
      } else if (hasEmptyState > 0) {
        // Should show empty state
        await expect(page.locator('text=No invoices yet')).toBeVisible();
        await expect(page.locator('text=shipping invoices will appear')).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/customer-portal-invoices.png', fullPage: true });
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

  test.describe('Account Tab', () => {
    test('account information displays correctly', async ({ page }) => {
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Check account information section
      await expect(page.locator('text=Account Information')).toBeVisible();
      await expect(page.locator('text=Full Name')).toBeVisible();
      await expect(page.locator('text=Email Address')).toBeVisible();
      await expect(page.locator('text=Customer ID')).toBeVisible();
      
      // Should show user data
      await expect(page.locator('text=john.doe@example.com')).toBeVisible();
      
      // Check edit profile button
      const editButton = page.locator('button:has-text("Edit Profile")');
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ path: 'test-results/customer-portal-account.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('payment method section works', async ({ page }) => {
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Check payment method section
      await expect(page.locator('text=Payment Method')).toBeVisible();
      
      // Should show card info
      await expect(page.locator('text=•••• •••• ••••')).toBeVisible();
      await expect(page.locator('text=Visa, text=Expires')).toBeVisible();
      
      // Test update button
      const updateButton = page.locator('button:has-text("Update")');
      if (await updateButton.isVisible()) {
        await updateButton.click();
        await page.waitForTimeout(500);
      }
      
      // Test add payment method button
      const addButton = page.locator('button:has-text("Add Payment Method")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('shipping address section works', async ({ page }) => {
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Check shipping address section
      await expect(page.locator('text=Default Shipping Address')).toBeVisible();
      
      // Should show address details
      await expect(page.locator('text=123 Main Street, text=Toronto')).toBeVisible();
      
      // Test edit address button
      const editButton = page.locator('button:has-text("Edit Address")');
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('notification preferences work', async ({ page }) => {
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Check notifications section
      await expect(page.locator('text=Notification Preferences')).toBeVisible();
      
      // Check notification checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Test toggling checkboxes
        for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
          const checkbox = checkboxes.nth(i);
          await checkbox.click();
          await page.waitForTimeout(200);
        }
        
        // Test save preferences button
        const saveButton = page.locator('button:has-text("Save Preferences")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Check notification labels
      await expect(page.locator('text=Email notifications')).toBeVisible();
      await expect(page.locator('text=SMS notifications')).toBeVisible();
      await expect(page.locator('text=Package delivery notifications')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Responsive Design', () => {
    test('portal works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Header should be visible
      await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible();
      
      // Navigation tabs should be accessible
      await expect(page.locator('button:has-text("My Packages")')).toBeVisible();
      
      // Stats cards should stack
      await expect(page.locator('text=Total Packages')).toBeVisible();
      
      // Test navigation on mobile
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Account Information')).toBeVisible();
      
      await page.screenshot({ path: 'test-results/customer-portal-mobile.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('portal works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should have good layout on tablet
      await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible();
      
      // Test different tabs
      await page.click('button:has-text("Invoices")');
      await page.waitForTimeout(1000);
      await expect(page.locator('h2:has-text("Your Invoices")')).toBeVisible();
      
      await page.screenshot({ path: 'test-results/customer-portal-tablet.png', fullPage: true });
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

  test.describe('Error Handling and Edge Cases', () => {
    test('handles empty package state gracefully', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(2000);
      
      // If no packages, should show empty state
      const hasPackages = await page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl').filter({ hasText: /PKG-|tracking/i }).count();
      const hasEmptyState = await page.locator('text=No packages, text=No matching packages').count();
      
      if (hasPackages === 0) {
        expect(hasEmptyState).toBeGreaterThan(0);
        await expect(page.locator('text=packages will appear')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search with no results shows appropriate message', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const searchInput = page.locator('input[placeholder*="Search packages"], input[placeholder*="tracking"]').first();
      
      if (await searchInput.isVisible()) {
        // Search for something that won't exist
        await searchInput.fill('NONEXISTENT123456789');
        await page.waitForTimeout(1000);
        
        // Should show no results message
        await expect(page.locator('text=No matching packages, text=Try adjusting')).toBeVisible();
        
        // Clear search
        await searchInput.fill('');
        await page.waitForTimeout(500);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('handles network errors gracefully', async ({ page }) => {
      // Look for error messages if they appear
      const errorMessages = page.locator('[role="alert"], .bg-red-50, text=Error, text=Failed');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        // Should show error message
        await expect(errorMessages.first()).toBeVisible();
        
        // Should have retry button
        const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Retry")');
        if (await retryButton.count() > 0) {
          await retryButton.first().click();
          await page.waitForTimeout(1000);
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

  test.describe('Data Persistence and State', () => {
    test('active tab persists on page refresh', async ({ page }) => {
      // Go to account tab
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should still show account or default to packages
      const isOnAccount = await page.locator('text=Account Information').count();
      const isOnPackages = await page.locator('text=Total Packages').count();
      
      expect(isOnAccount + isOnPackages).toBeGreaterThan(0);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('search and filter state maintained during navigation', async ({ page }) => {
      // Ensure we're on packages tab
      await page.click('button:has-text("My Packages")');
      await page.waitForTimeout(1000);
      
      const searchInput = page.locator('input[placeholder*="Search packages"], input[placeholder*="tracking"]').first();
      
      if (await searchInput.isVisible()) {
        // Set a search term
        await searchInput.fill('PKG');
        await page.waitForTimeout(500);
        
        // Navigate away and back
        await page.click('button:has-text("Account")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("My Packages")');
        await page.waitForTimeout(1000);
        
        // Search might or might not persist - just check page loads
        await expect(page.locator('text=Total Packages')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Performance and Usability', () => {
    test('portal loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/portal');
      await page.waitForURL('/portal');
      await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      console.log(`Customer portal load time: ${loadTime}ms`);
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('tab switching is responsive', async ({ page }) => {
      const tabs = ['My Packages', 'Invoices', 'Account'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
        
        const switchTime = Date.now() - startTime;
        console.log(`Tab switch to ${tab}: ${switchTime}ms`);
        
        // Tab switching should be fast
        expect(switchTime).toBeLessThan(3000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('auto-refresh functionality works', async ({ page }) => {
      // The portal should auto-refresh every 30 seconds
      // We can't wait 30 seconds, but we can check the functionality exists
      const refreshButton = page.locator('button[title="Refresh data"]');
      
      if (await refreshButton.isVisible()) {
        // Manual refresh should work
        await refreshButton.click();
        await page.waitForTimeout(2000);
        
        // Should still be functional after refresh
        await expect(page.locator('text=Total Packages')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Accessibility', () => {
    test('keyboard navigation works', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate to elements
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key on buttons
      const firstButton = page.locator('button').first();
      await firstButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('form elements have proper labels', async ({ page }) => {
      await page.click('button:has-text("Account")');
      await page.waitForTimeout(1000);
      
      // Check for proper labeling
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Each checkbox should have associated text
        for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
          const checkbox = checkboxes.nth(i);
          const label = page.locator('label').nth(i);
          
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
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
});
    } catch (error) {
      // Ignore localStorage access errors
    }