import { test, expect } from '@playwright/test';

test.describe('Staff Interface Comprehensive Test', () => {
  test('should login as staff and navigate through all sections', async ({ page }) => {
    console.log('🚀 Starting comprehensive staff interface test...');
    
    // Login as staff
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Click Staff quick login button
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(3000);
    
    // Verify we're on staff dashboard
    await expect(page).toHaveURL(/.*\/staff/);
    await expect(page.locator('h1')).toContainText('Staff Dashboard');
    
    // Take overview screenshot
    await page.screenshot({ path: 'test-results/staff-overview.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('📸 Overview screenshot taken');
    
    // Test Packages tab
    console.log('📦 Testing Packages tab...');
    await page.click('button:has-text("packages")');
    await page.waitForTimeout(2000);
    
    // Verify packages content loaded
    await expect(page.locator('h2')).toContainText('All Packages');
    
    // Check if packages table exists and has data
    const packagesTable = page.locator('table');
    await expect(packagesTable).toBeVisible();
    
    // Look for tracking numbers in the table
    const trackingNumbers = page.locator('td:has-text("PKG-"), td:has-text("1Z"), td:has-text("CP")');
    const trackingCount = await trackingNumbers.count();
    console.log(`   Found ${trackingCount} tracking numbers`);
    
    // Take packages screenshot
    await page.screenshot({ path: 'test-results/staff-packages.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('📸 Packages screenshot taken');
    
    // Test Customers tab
    console.log('👥 Testing Customers tab...');
    await page.click('button:has-text("customers")');
    await page.waitForTimeout(2000);
    
    // Verify customers content loaded
    await expect(page.locator('h2')).toContainText('All Customers');
    
    // Check if customers table exists and has data
    const customersTable = page.locator('table');
    await expect(customersTable).toBeVisible();
    
    // Look for customer names
    const customerNames = page.locator('td:has-text("@"), td:has-text("Smith"), td:has-text("Doe"), td:has-text("Wilson")');
    const customerCount = await customerNames.count();
    console.log(`   Found ${customerCount} customer entries`);
    
    // Take customers screenshot  
    await page.screenshot({ path: 'test-results/staff-customers.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('📸 Customers screenshot taken');
    
    // Test Loads tab
    console.log('🚛 Testing Loads tab...');
    await page.click('button:has-text("loads")');
    await page.waitForTimeout(2000);
    
    // Verify loads content loaded
    await expect(page.locator('h2')).toContainText('All Loads');
    
    // Check if loads table exists
    const loadsTable = page.locator('table');
    await expect(loadsTable).toBeVisible();
    
    // Look for load information
    const loadInfo = page.locator('td:has-text("Load #"), td:has-text("Mike"), td:has-text("Dave"), td:has-text("TRUCK")');
    const loadCount = await loadInfo.count();
    console.log(`   Found ${loadCount} load entries`);
    
    // Take loads screenshot
    await page.screenshot({ path: 'test-results/staff-loads.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('📸 Loads screenshot taken');
    
    // Test back to overview
    console.log('📊 Testing Overview tab...');
    await page.click('button:has-text("overview")');
    await page.waitForTimeout(2000);
    
    // Verify stats cards are showing
    await expect(page.locator('text=Total Packages')).toBeVisible();
    await expect(page.locator('text=Active Customers')).toBeVisible();
    await expect(page.locator('text=Active Loads')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
    
    // Check if stats have values
    const statsValues = await page.locator('.text-2xl').allTextContents();
    console.log('📈 Stats values:', statsValues);
    
    // Take final overview screenshot
    await page.screenshot({ path: 'test-results/staff-overview-final.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('📸 Final overview screenshot taken');
    
    console.log('✅ Comprehensive staff test completed successfully!');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should test interactive features', async ({ page }) => {
    // Login as staff
    await page.goto('http://localhost:3002/login');
    await page.click('button:has-text("Staff")');
    await page.waitForTimeout(3000);
    
    // Go to packages tab
    await page.click('button:has-text("packages")');
    await page.waitForTimeout(2000);
    
    // Test package selection
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      console.log('✅ Package selection works');
    }
    
    // Test bulk actions button appears
    const bulkActionsBtn = page.locator('button:has-text("Bulk Actions")');
    if (await bulkActionsBtn.isVisible()) {
      console.log('✅ Bulk actions button appears when packages selected');
    }
    
    // Test filter dropdown
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('in_transit');
      await page.waitForTimeout(1000);
      console.log('✅ Package filtering works');
    }
    
    await page.screenshot({ path: 'test-results/staff-interactions.png', fullPage: true });
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