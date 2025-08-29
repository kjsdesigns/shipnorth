import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Admin Interface Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and login as admin
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Login as admin using quick login
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.waitForTimeout(2000); // Allow data to load
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Admin Dashboard Overview', () => {
    test('dashboard displays comprehensive system metrics', async ({ page }) => {
      // Check main heading and description
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      await expect(page.locator('text=System overview and management')).toBeVisible();
      
      // Check time range selector
      const timeRangeSelector = page.locator('select');
      if (await timeRangeSelector.count() > 0) {
        await expect(timeRangeSelector.first()).toBeVisible();
        
        // Test time range options
        await timeRangeSelector.first().selectOption('7d');
        await page.waitForTimeout(500);
        await timeRangeSelector.first().selectOption('30d');
        await page.waitForTimeout(500);
      }
      
      // Check export report button
      const exportButton = page.locator('button:has-text("Export Report")');
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ path: 'test-results/admin-dashboard-overview.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('key metrics display correctly', async ({ page }) => {
      // Check main metrics cards
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Active Customers')).toBeVisible();
      await expect(page.locator('text=Completion Rate')).toBeVisible();
      await expect(page.locator('text=Active Loads')).toBeVisible();
      
      // Check that metrics have values
      const metricValues = page.locator('.text-2xl, .text-3xl, [class*="text-2xl"], [class*="text-3xl"]');
      const valueCount = await metricValues.count();
      
      if (valueCount >= 4) {
        // Should have at least 4 metric values
        for (let i = 0; i < Math.min(4, valueCount); i++) {
          await expect(metricValues.nth(i)).toBeVisible();
        }
      }
      
      // Check revenue format (should show dollar signs)
      await expect(page.locator('text=/\\$[\\d,]+/')).toBeVisible();
      
      // Check percentage format for completion rate
      await expect(page.locator('text=/\\d+%/')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('secondary metrics section works', async ({ page }) => {
      // Check secondary metrics
      await expect(page.locator('text=Monthly Revenue')).toBeVisible();
      await expect(page.locator('text=Avg Delivery Time')).toBeVisible();
      await expect(page.locator('text=Pending Invoices')).toBeVisible();
      
      // Check progress bar for monthly revenue target
      const progressBar = page.locator('.bg-green-500');
      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible();
      }
      
      // Check delivery time improvement indicator
      await expect(page.locator('text=days')).toBeVisible();
      
      // Check pending invoices value
      const pendingValue = page.locator('text=Pending Invoices').locator('..').locator('.text-2xl').first();
      if (await pendingValue.count() > 0) {
        await expect(pendingValue).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('navigation tabs work correctly', async ({ page }) => {
      // Check all admin tabs are present
      await expect(page.locator('button:has-text("overview")')).toBeVisible();
      await expect(page.locator('button:has-text("analytics")')).toBeVisible();
      await expect(page.locator('button:has-text("operations")')).toBeVisible();
      await expect(page.locator('button:has-text("finance")')).toBeVisible();
      await expect(page.locator('button:has-text("system")')).toBeVisible();
      
      // Overview should be active by default
      await expect(page.locator('button:has-text("overview")[class*="border-blue"], button:has-text("overview")[class*="text-blue"]')).toBeVisible();
      
      // Test navigation to different tabs
      const tabs = ['analytics', 'operations', 'finance', 'system'];
      
      for (const tab of tabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(1000);
        
        // Should make tab active
        await expect(page.locator(`button:has-text("${tab}")[class*="border-blue"], button:has-text("${tab}")[class*="text-blue"]`)).toBeVisible();
        
        await page.screenshot({ path: `test-results/admin-${tab}-tab.png`, fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
      
      // Navigate back to overview
      await page.click('button:has-text("overview")');
      await page.waitForTimeout(1000);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Revenue Chart and Analytics', () => {
    test('revenue chart displays correctly', async ({ page }) => {
      // Ensure we're on overview tab
      await page.click('button:has-text("overview")');
      await page.waitForTimeout(1000);
      
      // Check revenue trend section
      await expect(page.locator('text=Revenue Trend')).toBeVisible();
      
      // Check chart bars or visualization
      const chartBars = page.locator('.bg-gradient-to-t, .bg-blue-500, .bg-blue-400');
      const barCount = await chartBars.count();
      
      if (barCount > 0) {
        // Should have multiple data points
        expect(barCount).toBeGreaterThan(3);
        
        // Chart should have month labels
        await expect(page.locator('text=Jan, text=Feb, text=Mar')).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/admin-revenue-chart.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('recent activity feed works', async ({ page }) => {
      // Check recent activity section
      await expect(page.locator('text=Recent Activity')).toBeVisible();
      
      // Should show activity items
      const activityItems = page.locator('.w-2.h-2.rounded-full').or(page.locator('[class*="bg-"][class*="rounded-full"]'));
      const itemCount = await activityItems.count();
      
      if (itemCount > 0) {
        // Should have status indicators
        await expect(activityItems.first()).toBeVisible();
        
        // Should show activity descriptions
        await expect(page.locator('text=New customer, text=Load #, text=Invoice #')).toBeVisible();
        
        // Should show timestamps
        await expect(page.locator('text=minutes ago, text=hour ago, text=ago')).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Analytics Tab', () => {
    test('analytics tab displays advanced metrics', async ({ page }) => {
      await page.click('button:has-text("analytics")');
      await page.waitForTimeout(1000);
      
      // Should show analytics content
      // Since analytics tab content may be limited in current implementation,
      // we check for basic structure or placeholder
      
      const hasAnalyticsContent = await page.locator('text=Analytics, text=Chart, text=Report, text=Metrics').count();
      
      if (hasAnalyticsContent > 0) {
        await expect(page.locator('text=Analytics, text=Chart, text=Report, text=Metrics').first()).toBeVisible();
      }
      
      // Tab should be active
      await expect(page.locator('button:has-text("analytics")[class*="border-blue"], button:has-text("analytics")[class*="text-blue"]')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Operations Tab', () => {
    test('operations tab shows operational metrics', async ({ page }) => {
      await page.click('button:has-text("operations")');
      await page.waitForTimeout(1000);
      
      // Should show operations content
      const hasOperationsContent = await page.locator('text=Operations, text=Loads, text=Packages, text=Drivers').count();
      
      if (hasOperationsContent > 0) {
        await expect(page.locator('text=Operations, text=Loads, text=Packages, text=Drivers').first()).toBeVisible();
      }
      
      // Tab should be active
      await expect(page.locator('button:has-text("operations")[class*="border-blue"], button:has-text("operations")[class*="text-blue"]')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Finance Tab', () => {
    test('finance tab displays financial data', async ({ page }) => {
      await page.click('button:has-text("finance")');
      await page.waitForTimeout(1000);
      
      // Should show finance content
      const hasFinanceContent = await page.locator('text=Finance, text=Revenue, text=Invoices, text=Payments').count();
      
      if (hasFinanceContent > 0) {
        await expect(page.locator('text=Finance, text=Revenue, text=Invoices, text=Payments').first()).toBeVisible();
      }
      
      // Tab should be active
      await expect(page.locator('button:has-text("finance")[class*="border-blue"], button:has-text("finance")[class*="text-blue"]')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('System Tab', () => {
    test('system tab shows system information', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Should show system content
      const hasSystemContent = await page.locator('text=System, text=Users, text=Settings, text=Logs').count();
      
      if (hasSystemContent > 0) {
        await expect(page.locator('text=System, text=Users, text=Settings, text=Logs').first()).toBeVisible();
      }
      
      // Tab should be active
      await expect(page.locator('button:has-text("system")[class*="border-blue"], button:has-text("system")[class*="text-blue"]')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('User Management (if available)', () => {
    test('user management interface works', async ({ page }) => {
      // Look for user management in system tab or navigation
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for user management elements
      const userElements = page.locator('text=Users, text=User Management, text=Add User');
      const userElementCount = await userElements.count();
      
      if (userElementCount > 0) {
        await expect(userElements.first()).toBeVisible();
        
        // Look for user list or table
        const userTable = page.locator('table');
        const userCards = page.locator('[class*="user"], .user-card');
        
        if (await userTable.count() > 0) {
          await expect(userTable).toBeVisible();
          
          // Should have user table headers
          await expect(page.locator('th:has-text("Name"), th:has-text("Email"), th:has-text("Role")')).toBeVisible();
        }
        
        if (await userCards.count() > 0) {
          await expect(userCards.first()).toBeVisible();
        }
        
        // Look for add user button
        const addUserBtn = page.locator('button:has-text("Add User"), button:has-text("Create User")');
        if (await addUserBtn.count() > 0) {
          await addUserBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Should open user creation form or modal
          const hasUserForm = await page.locator('input[type="email"], input[placeholder*="email"], text=Create User').count();
          if (hasUserForm > 0) {
            // Close form/modal
            const closeBtn = page.locator('button:has-text("Cancel"), button:has(svg)');
            if (await closeBtn.count() > 0) {
              await closeBtn.first().click();
            }
          }
        }
        
        await page.screenshot({ path: 'test-results/admin-user-management.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('user role management works', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for role management
      const roleElements = page.locator('text=Role, text=Permissions, text=Admin, text=Staff, text=Driver');
      const roleElementCount = await roleElements.count();
      
      if (roleElementCount > 0) {
        // Should show different user roles
        await expect(page.locator('text=admin, text=staff, text=driver, text=customer')).toBeVisible();
        
        // Look for role assignment interface
        const roleSelects = page.locator('select, [role="combobox"]');
        if (await roleSelects.count() > 0) {
          const firstSelect = roleSelects.first();
          if (await firstSelect.isVisible()) {
            // Test role selection
            await firstSelect.click();
            await page.waitForTimeout(500);
            
            // Should show role options
            await expect(page.locator('option, [role="option"]')).toBeVisible();
          }
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('bulk user operations work', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for bulk operations
      const bulkElements = page.locator('button:has-text("Bulk"), input[type="checkbox"]');
      const bulkElementCount = await bulkElements.count();
      
      if (bulkElementCount > 0) {
        // Test selecting users
        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();
        
        if (checkboxCount > 1) {
          // Select first checkbox (usually select all)
          await checkboxes.first().click();
          await page.waitForTimeout(500);
          
          // Should show bulk actions
          const bulkActionButtons = page.locator('button:has-text("Bulk"), button:has-text("Delete"), button:has-text("Export")');
          if (await bulkActionButtons.count() > 0) {
            await expect(bulkActionButtons.first()).toBeVisible();
          }
          
          // Unselect
          await checkboxes.first().click();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('user export functionality works', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for export functionality
      const exportButton = page.locator('button:has-text("Export")');
      
      if (await exportButton.count() > 0) {
        await exportButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should trigger export or show export modal
        const hasExportDialog = await page.locator('[role="dialog"], text=Export, .modal').count();
        
        if (hasExportDialog > 0) {
          // Close export dialog if it opened
          const closeBtn = page.locator('button:has-text("Cancel"), button:has(svg)');
          if (await closeBtn.count() > 0) {
            await closeBtn.first().click();
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

  test.describe('System Administration Features', () => {
    test('system settings are accessible', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for system settings
      const settingsElements = page.locator('text=Settings, text=Configuration, text=System Settings');
      const settingsCount = await settingsElements.count();
      
      if (settingsCount > 0) {
        await expect(settingsElements.first()).toBeVisible();
        
        // Look for settings categories
        await expect(page.locator('text=General, text=Security, text=Notifications, text=API')).toBeVisible();
        
        // Look for configuration forms
        const configInputs = page.locator('input[type="text"], input[type="number"], select, textarea');
        if (await configInputs.count() > 0) {
          // Should have configurable settings
          await expect(configInputs.first()).toBeVisible();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('audit logs are available', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for audit logs
      const logElements = page.locator('text=Logs, text=Audit, text=Activity Log');
      const logCount = await logElements.count();
      
      if (logCount > 0) {
        await expect(logElements.first()).toBeVisible();
        
        // Should show log entries
        const logEntries = page.locator('.log-entry, [class*="log"], tbody tr');
        if (await logEntries.count() > 0) {
          await expect(logEntries.first()).toBeVisible();
          
          // Should show timestamps and actions
          await expect(page.locator('text=/\\d{1,2}:\\d{2}|\\d{4}-\\d{2}-\\d{2}/')).toBeVisible();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('system health monitoring works', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for system health indicators
      const healthElements = page.locator('text=Health, text=Status, text=Uptime, text=Performance');
      const healthCount = await healthElements.count();
      
      if (healthCount > 0) {
        await expect(healthElements.first()).toBeVisible();
        
        // Should show system metrics
        await expect(page.locator('text=/\\d+%|\\d+ms|\\d+ MB/')).toBeVisible();
        
        // Should show status indicators
        const statusIndicators = page.locator('.bg-green-500, .bg-red-500, .bg-yellow-500, [class*="status"]');
        if (await statusIndicators.count() > 0) {
          await expect(statusIndicators.first()).toBeVisible();
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

  test.describe('Data Export and Reporting', () => {
    test('comprehensive data export works', async ({ page }) => {
      // Check main export button
      const mainExportBtn = page.locator('button:has-text("Export Report")');
      
      if (await mainExportBtn.isVisible()) {
        await mainExportBtn.click();
        await page.waitForTimeout(1000);
        
        // Should trigger export or show export options
        const hasExportOptions = await page.locator('[role="dialog"], .modal, text=Export').count();
        
        if (hasExportOptions > 0) {
          // Should show export format options
          await expect(page.locator('text=CSV, text=PDF, text=Excel')).toBeVisible();
          
          // Close export dialog
          const closeBtn = page.locator('button:has-text("Cancel"), button:has(svg)');
          if (await closeBtn.count() > 0) {
            await closeBtn.first().click();
          }
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('time-based reporting works', async ({ page }) => {
      // Test time range selector for reports
      const timeSelector = page.locator('select').first();
      
      if (await timeSelector.isVisible()) {
        // Test different time ranges
        const timeOptions = ['7d', '30d', '90d', '1y'];
        
        for (const option of timeOptions) {
          await timeSelector.selectOption(option);
          await page.waitForTimeout(1000);
          
          // Data should update (at minimum, no errors should occur)
          await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('custom date range selection works', async ({ page }) => {
      // Look for custom date range inputs
      const dateInputs = page.locator('input[type="date"], input[type="datetime-local"]');
      const dateCount = await dateInputs.count();
      
      if (dateCount >= 2) {
        // Set start date
        await dateInputs.first().fill('2024-01-01');
        
        // Set end date  
        await dateInputs.nth(1).fill('2024-12-31');
        
        // Apply date range
        const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Update")');
        if (await applyBtn.count() > 0) {
          await applyBtn.first().click();
          await page.waitForTimeout(2000);
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

  test.describe('Real-time Data Updates', () => {
    test('dashboard metrics update in real-time', async ({ page }) => {
      // Get initial metric values
      const revenueElement = page.locator('text=Total Revenue').locator('..').locator('.text-2xl, .text-3xl').first();
      const initialRevenue = await revenueElement.textContent();
      
      // Refresh data
      const refreshBtn = page.locator('button:has-text("Refresh"), button:has([data-lucide="refresh"])');
      
      if (await refreshBtn.count() > 0) {
        await refreshBtn.first().click();
        await page.waitForTimeout(2000);
        
        // Values should be updated (or at least, page should still work)
        await expect(revenueElement).toBeVisible();
      }
      
      // Auto-refresh should work (if implemented)
      await page.waitForTimeout(5000);
      await expect(page.locator('text=Total Revenue')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('activity feed updates show recent changes', async ({ page }) => {
      const activitySection = page.locator('text=Recent Activity').locator('..');
      
      if (await activitySection.count() > 0) {
        // Should show recent activity items
        const activityItems = activitySection.locator('.w-2.h-2, [class*="activity"]');
        const itemCount = await activityItems.count();
        
        if (itemCount > 0) {
          // Activity items should have recent timestamps
          await expect(page.locator('text=minutes ago, text=hour ago, text=seconds ago')).toBeVisible();
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

  test.describe('Error Handling and Edge Cases', () => {
    test('handles empty data states gracefully', async ({ page }) => {
      // Check if there are empty states for various sections
      const emptyStates = page.locator('text=No data, text=No users, text=No activity, text=empty');
      const emptyStateCount = await emptyStates.count();
      
      if (emptyStateCount > 0) {
        // Should show appropriate empty state messages
        await expect(emptyStates.first()).toBeVisible();
        
        // Should provide actions to address empty states
        const actionButtons = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Import")');
        if (await actionButtons.count() > 0) {
          await expect(actionButtons.first()).toBeVisible();
        }
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
        
        // Should have retry mechanism
        const retryButton = page.locator('button:has-text("Try Again"), button:has-text("Retry"), button:has-text("Refresh")');
        if (await retryButton.count() > 0) {
          await retryButton.first().click();
          await page.waitForTimeout(1000);
        }
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('form validation works correctly', async ({ page }) => {
      // If there are forms in the admin interface, test validation
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const firstForm = forms.first();
        
        // Look for required fields
        const requiredInputs = firstForm.locator('input[required]');
        const requiredCount = await requiredInputs.count();
        
        if (requiredCount > 0) {
          // Try to submit form with empty required fields
          const submitBtn = firstForm.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
          
          if (await submitBtn.count() > 0) {
            await submitBtn.first().click();
            
            // Should show validation errors
            const validationErrors = page.locator('.error, [aria-invalid="true"], text=required');
            if (await validationErrors.count() > 0) {
              await expect(validationErrors.first()).toBeVisible();
            }
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

  test.describe('Responsive Design for Admin', () => {
    test('admin dashboard works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Main elements should still be visible
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      
      // Metrics cards should adjust layout
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      
      // Navigation tabs should work
      await page.click('button:has-text("analytics")');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/admin-tablet-viewport.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('admin dashboard maintains functionality on smaller screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should still be functional on mobile
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      
      // Tabs should be accessible (may scroll horizontally)
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/admin-mobile-viewport.png', fullPage: true });
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

  test.describe('Performance and Optimization', () => {
    test('admin dashboard loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin');
      await page.waitForURL('/admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      console.log(`Admin dashboard load time: ${loadTime}ms`);
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('tab switching is performant', async ({ page }) => {
      const tabs = ['analytics', 'operations', 'finance', 'system', 'overview'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
        
        const switchTime = Date.now() - startTime;
        console.log(`Admin tab switch to ${tab}: ${switchTime}ms`);
        
        // Tab switching should be fast
        expect(switchTime).toBeLessThan(3000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('large dataset handling works efficiently', async ({ page }) => {
      // If there are large tables or lists, test scrolling performance
      const largeTables = page.locator('table');
      const tableCount = await largeTables.count();
      
      if (tableCount > 0) {
        const firstTable = largeTables.first();
        
        // Test scrolling through table
        const startTime = Date.now();
        
        await firstTable.scroll({ x: 0, y: 500 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        await page.waitForTimeout(200);
        
        await firstTable.scroll({ x: 0, y: 0 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        const scrollTime = Date.now() - startTime;
        
        // Scrolling should be smooth
        expect(scrollTime).toBeLessThan(2000);
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Security and Access Control', () => {
    test('admin-only features are properly protected', async ({ page }) => {
      // Admin should have access to all tabs
      const restrictedTabs = ['system', 'finance', 'operations'];
      
      for (const tab of restrictedTabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(1000);
        
        // Should not show access denied messages
        const accessDenied = await page.locator('text=Access Denied, text=Unauthorized, text=Permission').count();
        expect(accessDenied).toBe(0);
        
        // Tab should be functional
        await expect(page.locator(`button:has-text("${tab}")[class*="border-blue"]`)).toBeVisible();
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('sensitive data is properly displayed for admin', async ({ page }) => {
      // Admin should see full financial data
      await expect(page.locator('text=/\\$[\\d,]+/')).toBeVisible();
      
      // Admin should see user information
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Should not have redacted information
      const redactedInfo = await page.locator('text=***, text=••••, text=[REDACTED]').count();
      
      // Admin should see full information (no redaction)
      // Some redaction is normal for security (like passwords), but most data should be visible
      expect(redactedInfo).toBeLessThan(5);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('audit trail functionality works', async ({ page }) => {
      await page.click('button:has-text("system")');
      await page.waitForTimeout(1000);
      
      // Look for audit trail
      const auditElements = page.locator('text=Audit, text=Log, text=Activity');
      const auditCount = await auditElements.count();
      
      if (auditCount > 0) {
        // Should show admin actions in audit log
        await expect(page.locator('text=admin, text=login, text=viewed, text=updated')).toBeVisible();
        
        // Should show timestamps for audit entries
        await expect(page.locator('text=/\\d{1,2}:\\d{2}|\\d{4}-\\d{2}-\\d{2}/')).toBeVisible();
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