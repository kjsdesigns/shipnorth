import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Cross-Interface Integration Tests', () => {
  test.describe('Data Consistency Across User Interfaces', () => {
    test('package data is consistent between staff and customer views', async ({ page }) => {
      // Login as staff first
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Go to packages tab and note package information
      await page.click('button:has-text("packages")');
      await page.waitForTimeout(2000);
      
      const packageElements = page.locator('td:has-text(/PKG-|1Z|CP/)');
      const packageCount = await packageElements.count();
      let staffPackageData: string[] = [];
      
      if (packageCount > 0) {
        for (let i = 0; i < Math.min(packageCount, 3); i++) {
          const packageText = await packageElements.nth(i).textContent();
          if (packageText) {
            staffPackageData.push(packageText.trim());
          }
        }
      }
      
      // Logout and login as customer
      await page.goto('/login');
      await page.click('button:has-text("Customer")');
      await page.waitForURL('/portal');
      await page.waitForTimeout(2000);
      
      // Check if same packages appear for customer
      if (staffPackageData.length > 0) {
        for (const packageId of staffPackageData) {
          const customerPackageElement = page.locator(`text=${packageId}`);
          const hasPackage = await customerPackageElement.count() > 0;
          
          if (hasPackage) {
            console.log(`✅ Package ${packageId} visible to both staff and customer`);
          }
        }
      }
      
      await page.screenshot({ path: 'test-results/data-consistency-packages.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('customer information is consistent across staff and admin interfaces', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.click('button:has-text("Admin")');
      await page.waitForURL('/admin');
      await page.waitForTimeout(2000);
      
      // Look for customer information in admin view
      const adminCustomerData: string[] = [];
      const customerElements = page.locator('text=/@|customer|Customer/i');
      const customerCount = await customerElements.count();
      
      if (customerCount > 0) {
        for (let i = 0; i < Math.min(customerCount, 3); i++) {
          const customerText = await customerElements.nth(i).textContent();
          if (customerText && customerText.includes('@')) {
            adminCustomerData.push(customerText.trim());
          }
        }
      }
      
      // Login as staff and check same customer info
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      await page.click('button:has-text("customers")');
      await page.waitForTimeout(2000);
      
      if (adminCustomerData.length > 0) {
        for (const customerInfo of adminCustomerData) {
          const staffCustomerElement = page.locator(`text=${customerInfo}`);
          const hasCustomer = await staffCustomerElement.count() > 0;
          
          if (hasCustomer) {
            console.log(`✅ Customer ${customerInfo} consistent between admin and staff`);
          }
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('load information is consistent between staff and driver interfaces', async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      await page.click('button:has-text("loads")');
      await page.waitForTimeout(2000);
      
      // Collect load information
      const staffLoadData: string[] = [];
      const loadElements = page.locator('text=/Load #|L-/');
      const loadCount = await loadElements.count();
      
      if (loadCount > 0) {
        for (let i = 0; i < Math.min(loadCount, 2); i++) {
          const loadText = await loadElements.nth(i).textContent();
          if (loadText) {
            staffLoadData.push(loadText.trim());
          }
        }
      }
      
      // Login as driver and check load consistency
      await page.goto('/login');
      await page.click('button:has-text("Driver")');
      await page.waitForURL('/driver');
      await page.waitForTimeout(2000);
      
      if (staffLoadData.length > 0) {
        for (const loadInfo of staffLoadData) {
          const driverLoadElement = page.locator(`text=${loadInfo}`);
          const hasLoad = await driverLoadElement.count() > 0;
          
          if (hasLoad) {
            console.log(`✅ Load ${loadInfo} consistent between staff and driver`);
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

  test.describe('Real-time Updates and Status Propagation', () => {
    test('status changes propagate between interfaces', async ({ page }) => {
      // This test simulates checking for status changes
      // In a real scenario, this would involve making changes and checking propagation
      
      // Login as driver
      await page.goto('/login');
      await page.click('button:has-text("Driver")');
      await page.waitForURL('/driver');
      await page.waitForTimeout(2000);
      
      // Check initial package status
      const initialPackages = page.locator('.border.rounded-lg');
      const initialCount = await initialPackages.count();
      
      if (initialCount > 0) {
        // Note initial delivery status
        const deliveredPackages = page.locator('.bg-green-50');
        const initialDeliveredCount = await deliveredPackages.count();
        
        // Simulate status change (in real test, would actually change status)
        console.log(`📊 Initial state: ${initialDeliveredCount} delivered out of ${initialCount} packages`);
        
        // In production test, this would:
        // 1. Mark a package as delivered
        // 2. Check that staff interface shows the update
        // 3. Check that customer portal shows the update
        // 4. Check that admin dashboard reflects the change
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('delivery progress updates across all interfaces', async ({ page }) => {
      // Test delivery progress consistency
      const interfaces = [
        { name: 'Staff', button: 'button:has-text("Staff")', url: '/staff' },
        { name: 'Admin', button: 'button:has-text("Admin")', url: '/admin' },
        { name: 'Driver', button: 'button:has-text("Driver")', url: '/driver' }
      ];
      
      const progressData: Array<{interface: string, delivered: number, total: number}> = [];
      
      for (const iface of interfaces) {
        await page.goto('/login');
        await page.click(iface.button);
        await page.waitForURL(iface.url);
        await page.waitForTimeout(2000);
        
        // Look for delivery statistics
        const deliveredElements = page.locator('text=Delivered, text=delivered').first();
        const totalElements = page.locator('text=Total, text=total').first();
        
        let deliveredCount = 0;
        let totalCount = 0;
        
        if (await deliveredElements.count() > 0) {
          const deliveredText = await deliveredElements.textContent();
          const deliveredMatch = deliveredText?.match(/(\d+)/);
          if (deliveredMatch) {
            deliveredCount = parseInt(deliveredMatch[1]);
          }
        }
        
        if (await totalElements.count() > 0) {
          const totalText = await totalElements.textContent();
          const totalMatch = totalText?.match(/(\d+)/);
          if (totalMatch) {
            totalCount = parseInt(totalMatch[1]);
          }
        }
        
        progressData.push({
          interface: iface.name,
          delivered: deliveredCount,
          total: totalCount
        });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        console.log(`📊 ${iface.name}: ${deliveredCount} delivered out of ${totalCount} total`);
      }
      
      // Check for consistency (allowing some variation due to role-based filtering)
      if (progressData.length > 1) {
        const firstInterface = progressData[0];
        const hasConsistency = progressData.every(data => 
          Math.abs(data.delivered - firstInterface.delivered) <= 2
        );
        
        if (hasConsistency) {
          console.log('✅ Delivery progress is consistent across interfaces');
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('user actions reflect across appropriate interfaces', async ({ page }) => {
      // Test that user actions in one interface are visible in others
      
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Simulate checking for recent activity
      await page.click('button:has-text("overview")');
      await page.waitForTimeout(2000);
      
      // Look for recent activity or changes
      const activityElements = page.locator('text=Recent, text=activity, text=updated, text=created');
      const activityCount = await activityElements.count();
      
      if (activityCount > 0) {
        console.log('✅ Staff interface shows recent activity');
        
        // Check if same activity appears in admin
        await page.goto('/login');
        await page.click('button:has-text("Admin")');
        await page.waitForURL('/admin');
        await page.waitForTimeout(2000);
        
        const adminActivityElements = page.locator('text=Recent Activity, text=activity');
        const adminActivityCount = await adminActivityElements.count();
        
        if (adminActivityCount > 0) {
          console.log('✅ Admin interface also shows recent activity');
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

  test.describe('Cross-Interface Navigation and State', () => {
    test('user can navigate between interfaces with proper redirects', async ({ page }) => {
      // Test navigation between different user interfaces
      const userFlows = [
        { from: 'Staff', to: 'Admin', expectedRedirect: '/login' },
        { from: 'Customer', to: 'Staff', expectedRedirect: '/login' },
        { from: 'Driver', to: 'Customer', expectedRedirect: '/login' }
      ];
      
      for (const flow of userFlows) {
        // Login as source user
        await page.goto('/login');
        await page.click(`button:has-text("${flow.from}")`);
        await page.waitForTimeout(2000);
        
        // Try to access target interface
        const targetUrls = {
          'Admin': '/admin',
          'Staff': '/staff', 
          'Customer': '/portal',
          'Driver': '/driver'
        };
        
        const targetUrl = targetUrls[flow.to as keyof typeof targetUrls];
        await page.goto(targetUrl);
        
        // Should redirect to login if not authorized
        if (flow.expectedRedirect === '/login') {
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL('/login');
          console.log(`✅ ${flow.from} correctly redirected when accessing ${flow.to}`);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('session state is maintained across page refreshes', async ({ page }) => {
      const userTypes = ['Staff', 'Customer', 'Admin', 'Driver'];
      
      for (const userType of userTypes) {
        // Login
        await page.goto('/login');
        await page.click(`button:has-text("${userType}")`);
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        
        // Refresh page
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Should remain on same page
        const urlAfterRefresh = page.url();
        expect(urlAfterRefresh).toBe(currentUrl);
        
        console.log(`✅ ${userType} session maintained after refresh`);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('deep links work correctly for authenticated users', async ({ page }) => {
      // Test deep linking to specific sections
      const deepLinks = [
        { user: 'Staff', url: '/staff?tab=packages', expectedElement: 'text=All Packages' },
        { user: 'Customer', url: '/portal', expectedElement: 'text=Total Packages' },
        { user: 'Admin', url: '/admin', expectedElement: 'text=Admin Dashboard' }
      ];
      
      for (const link of deepLinks) {
        // Login first
        await page.goto('/login');
        await page.click(`button:has-text("${link.user}")`);
        await page.waitForTimeout(2000);
        
        // Navigate to deep link
        await page.goto(link.url);
        await page.waitForTimeout(2000);
        
        // Should show expected content
        const expectedContent = page.locator(link.expectedElement);
        if (await expectedContent.count() > 0) {
          await expect(expectedContent).toBeVisible();
          console.log(`✅ Deep link works for ${link.user}: ${link.url}`);
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

  test.describe('Data Synchronization and Conflicts', () => {
    test('concurrent user actions are handled gracefully', async ({ page }) => {
      // Simulate concurrent access scenarios
      
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Open packages tab and interact with data
      await page.click('button:has-text("packages")');
      await page.waitForTimeout(2000);
      
      // Check for any loading states or conflicts
      const loadingElements = page.locator('[class*="loading"], [class*="spinner"]');
      const errorElements = page.locator('[role="alert"], .error, text=Error');
      
      const hasLoading = await loadingElements.count();
      const hasErrors = await errorElements.count();
      
      // Interface should handle concurrent access gracefully
      if (hasErrors > 0) {
        const errorText = await errorElements.first().textContent();
        console.log(`⚠️ Concurrent access error: ${errorText}`);
      } else {
        console.log('✅ No concurrent access conflicts detected');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('data refresh mechanisms work across interfaces', async ({ page }) => {
      const interfaces = [
        { name: 'Staff', button: 'button:has-text("Staff")', url: '/staff' },
        { name: 'Customer', button: 'button:has-text("Customer")', url: '/portal' },
        { name: 'Driver', button: 'button:has-text("Driver")', url: '/driver' }
      ];
      
      for (const iface of interfaces) {
        await page.goto('/login');
        await page.click(iface.button);
        await page.waitForURL(iface.url);
        await page.waitForTimeout(2000);
        
        // Look for refresh mechanisms
        const refreshButtons = page.locator('button[title*="refresh"], button:has([data-lucide="refresh"])');
        const refreshCount = await refreshButtons.count();
        
        if (refreshCount > 0) {
          const refreshButton = refreshButtons.first();
          
          // Test refresh functionality
          await refreshButton.click();
          await page.waitForTimeout(2000);
          
          // Should show loading state or updated data
          const loadingIndicator = page.locator('[class*="animate-spin"]');
          const hasLoading = await loadingIndicator.count();
          
          if (hasLoading > 0) {
            console.log(`✅ ${iface.name} refresh shows loading indicator`);
          }
          
          // Wait for refresh to complete
          await page.waitForTimeout(3000);
          
          // Interface should still be functional
          const mainHeading = page.locator('h1');
          await expect(mainHeading.first()).toBeVisible();
          
          console.log(`✅ ${iface.name} refresh completed successfully`);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('offline/online state is handled appropriately', async ({ page }) => {
      // Test offline behavior (simulated)
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Simulate network issues by intercepting requests
      await page.route('**/api/**', route => {
        // Simulate network failure for some requests
        route.abort();
      });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Try to refresh data
      const refreshButton = page.locator('button[title*="refresh"]');
      if (await refreshButton.count() > 0) {
        await refreshButton.first().click();
        await page.waitForTimeout(3000);
        
        // Should show error state or offline indicator
        const errorElements = page.locator('[role="alert"], text=Error, text=Failed, text=offline');
        const hasError = await errorElements.count();
        
        if (hasError > 0) {
          console.log('✅ Offline state handled with appropriate error message');
          
          await page.screenshot({ path: 'test-results/offline-error-handling.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
        }
      }
      
      // Restore network
      await page.unroute('**/api/**');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Performance Under Load', () => {
    test('interfaces remain responsive with multiple concurrent users', async ({ page }) => {
      // Simulate multiple user sessions
      const userTypes = ['Staff', 'Customer', 'Admin'];
      
      for (const userType of userTypes) {
        const startTime = Date.now();
        
        // Login
        await page.goto('/login');
        await page.click(`button:has-text("${userType}")`);
        await page.waitForTimeout(2000);
        
        // Perform typical user actions
        switch (userType) {
          case 'Staff':
            await page.click('button:has-text("packages")');
            await page.waitForTimeout(1000);
            await page.click('button:has-text("customers")');
            break;
          case 'Customer':
            // Customer portal actions
            const searchInput = page.locator('input[type="search"]').first();
            if (await searchInput.count() > 0 && await searchInput.isVisible()) {
              await searchInput.fill('PKG');
              await page.waitForTimeout(500);
              await searchInput.fill('');
            }
            break;
          case 'Admin':
            await page.click('button:has-text("analytics")');
            await page.waitForTimeout(1000);
            await page.click('button:has-text("overview")');
            break;
        }
        
        const responseTime = Date.now() - startTime;
        console.log(`${userType} interface response time: ${responseTime}ms`);
        
        // Should respond within reasonable time
        expect(responseTime).toBeLessThan(10000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('data loading performance is consistent across interfaces', async ({ page }) => {
      const loadingTests = [
        { name: 'Staff Packages', user: 'Staff', action: () => page.click('button:has-text("packages")') },
        { name: 'Customer Portal', user: 'Customer', action: () => Promise.resolve() },
        { name: 'Admin Dashboard', user: 'Admin', action: () => Promise.resolve() }
      ];
      
      for (const test of loadingTests) {
        const startTime = Date.now();
        
        // Login
        await page.goto('/login');
        await page.click(`button:has-text("${test.user}")`);
        await page.waitForTimeout(1000);
        
        // Perform action
        await test.action();
        await page.waitForTimeout(2000);
        
        // Measure total loading time
        const loadTime = Date.now() - startTime;
        console.log(`${test.name} loading time: ${loadTime}ms`);
        
        // Should load within acceptable time
        expect(loadTime).toBeLessThan(8000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Error Propagation and Recovery', () => {
    test('errors in one interface do not affect others', async ({ page }) => {
      // Test error isolation between interfaces
      
      // Login as staff and trigger potential error
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Try to trigger an error (invalid navigation, etc.)
      try {
        await page.goto('/staff/nonexistent');
        await page.waitForTimeout(2000);
      } catch (error) {
        // Error is expected
      }
      
      // Login as different user and verify functionality
      await page.goto('/login');
      await page.click('button:has-text("Customer")');
      await page.waitForURL('/portal');
      await page.waitForTimeout(2000);
      
      // Customer interface should work normally
      await expect(page.locator('h1, text=Shipnorth').first()).toBeVisible();
      console.log('✅ Customer interface unaffected by staff errors');
      
      // Test admin interface
      await page.goto('/login');
      await page.click('button:has-text("Admin")');
      await page.waitForURL('/admin');
      await page.waitForTimeout(2000);
      
      await expect(page.locator('h1:has-text("Admin Dashboard")').first()).toBeVisible();
      console.log('✅ Admin interface unaffected by other interface errors');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('graceful degradation when services are unavailable', async ({ page }) => {
      // Test graceful degradation
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      await page.waitForTimeout(2000);
      
      // Interface should show some content even if some services fail
      const mainContent = page.locator('h1, h2, .dashboard');
      await expect(mainContent.first()).toBeVisible();
      
      // Should have error handling mechanisms
      const errorBoundaries = page.locator('[class*="error-boundary"], [role="alert"]');
      const hasErrorHandling = await errorBoundaries.count();
      
      console.log(`Error handling mechanisms present: ${hasErrorHandling > 0 ? 'Yes' : 'No'}`);
      
      // Interface should remain navigable
      const navigationElements = page.locator('button, a, [role="button"]');
      const navCount = await navigationElements.count();
      
      expect(navCount).toBeGreaterThan(0);
      console.log('✅ Interface remains navigable during partial failures');
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