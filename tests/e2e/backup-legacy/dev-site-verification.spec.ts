import { test, expect } from '@playwright/test';

test.describe('Dev Site Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set base URL to dev site
    test.setTimeout(60000); // Increase timeout for slower dev site
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should load homepage correctly', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net');
    
    // Check that homepage loads
    await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible({ timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('text=Autonomous Shipping & Billing')).toBeVisible();
    
    // Check navigation buttons
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should navigate to login page', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net');
    
    // Click sign in button
    await page.click('a:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    
    // Should be on login page
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should access staff dashboard with test credentials', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login');
    
    // Fill in staff credentials (from seed data)
    await page.fill('input[name="email"]', 'staff@shipnorth.com');
    await page.fill('input[name="password"]', 'staff123');
    
    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Should be redirected to staff dashboard
    await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('text=Manage packages, customers, and shipments')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should navigate between staff tabs correctly', async ({ page }) => {
    // Login first
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login');
    await page.fill('input[name="email"]', 'staff@shipnorth.com');
    await page.fill('input[name="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Test tab navigation
    await page.click('button:has-text("packages")');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("All Packages")')).toBeVisible();
    
    await page.click('button:has-text("customers")');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("All Customers")')).toBeVisible();
    
    await page.click('button:has-text("loads")');
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("All Loads")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should verify sidebar navigation works correctly', async ({ page }) => {
    // Login first
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login');
    await page.fill('input[name="email"]', 'staff@shipnorth.com');
    await page.fill('input[name="password"]', 'staff123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Click Customers in sidebar (this was the problematic navigation)
    await page.click('a:has-text("Customers")');
    await page.waitForLoadState('networkidle');
    
    // Should stay on staff page but switch to customers tab
    await expect(page).toHaveURL(/\/staff\?tab=customers/);
    await expect(page.locator('h2:has-text("All Customers")')).toBeVisible();
    
    // Test Packages navigation
    await page.click('a:has-text("Packages")');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/staff\?tab=packages/);
    await expect(page.locator('h2:has-text("All Packages")')).toBeVisible();
    
    // Test Loads navigation
    await page.click('a:has-text("Loads")');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/staff\?tab=loads/);
    await expect(page.locator('h2:has-text("All Loads")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should access customer registration page', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net');
    
    // Click Get Started button (should go to registration)
    await page.click('a:has-text("Get Started")');
    await page.waitForLoadState('networkidle');
    
    // Should be on registration page
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should verify driver portal access', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/login');
    
    // Fill in driver credentials (from seed data)
    await page.fill('input[name="email"]', 'driver@shipnorth.com');
    await page.fill('input[name="password"]', 'driver123');
    
    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Should be redirected to driver portal
    await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await expect(page.locator('text=GPS Enabled')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should handle 404 errors gracefully', async ({ page }) => {
    await page.goto('https://d3i19husj7b5d7.cloudfront.net/nonexistent-page');
    
    // Should either show 404 page or redirect to home
    // Next.js usually redirects to home for missing pages
    await page.waitForLoadState('networkidle');
    
    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should verify responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.goto('https://d3i19husj7b5d7.cloudfront.net');
    
    // Homepage should be responsive
    await expect(page.locator('h1:has-text("Shipnorth")')).toBeVisible({ timeout: 15000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Mobile menu should be available
    const menuButton = page.locator('button').filter({ hasText: /menu/i }).or(page.locator('[data-testid="mobile-menu"]')).or(page.locator('svg')).first();
    
    // Navigation should be functional on mobile
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }

test.describe('Dev Site API Integration', () => {
  test('should verify API backend is accessible', async ({ page }) => {
    // Test health endpoint
    const response = await page.request.get('https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com/health');
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    expect(health).toHaveProperty('status', 'healthy');
    expect(health).toHaveProperty('timestamp');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should verify authentication endpoint works', async ({ page }) => {
    // Test login endpoint with invalid credentials
    const response = await page.request.post('https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com/auth/login', {
      data: {
        email: 'invalid@example.com',
        password: 'invalid'
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Should return 401 or 400, not 500
    expect([400, 401]).toContain(response.status());
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }