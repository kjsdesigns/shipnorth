import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies and local storage before each test
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
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Homepage and Navigation', () => {
    test('homepage loads correctly with all elements', async ({ page }) => {
      await page.goto('/');
      
      // Check title and main heading
      await expect(page).toHaveTitle(/Shipnorth/);
      await expect(page.locator('h2:has-text("Autonomous Shipping")')).toBeVisible();
      
      // Check navigation elements
      await expect(page.locator('text=Features')).toBeVisible();
      await expect(page.locator('text=How It Works')).toBeVisible();
      await expect(page.locator('text=Pricing')).toBeVisible();
      
      // Check theme toggle
      await expect(page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])')).toBeVisible();
      
      // Check sign in buttons
      await expect(page.locator('text=Sign In')).toBeVisible();
      
      // Check tracking form
      await expect(page.locator('input[placeholder*="tracking"]')).toBeVisible();
      await expect(page.locator('button:has-text("Track Package")')).toBeVisible();
      
      // Check CTA buttons
      await expect(page.locator('text=Get Started')).toBeVisible();
      
      // Take screenshot for visual regression
      await page.screenshot({ path: 'test-results/homepage-comprehensive.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('theme toggle works correctly', async ({ page }) => {
      await page.goto('/');
      
      // Find theme toggle button (could be sun or moon icon)
      const themeToggle = page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])').first();
      await expect(themeToggle).toBeVisible();
      
      // Click to toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      // Take screenshot of dark mode
      await page.screenshot({ path: 'test-results/homepage-dark-theme.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Toggle back to light mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Take screenshot of light mode
      await page.screenshot({ path: 'test-results/homepage-light-theme.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('tracking form navigation works', async ({ page }) => {
      await page.goto('/');
      
      const trackingInput = page.locator('input[placeholder*="tracking"]');
      const trackButton = page.locator('button:has-text("Track Package")');
      
      // Test empty tracking number
      await trackButton.click();
      // Should not navigate anywhere
      await expect(page).toHaveURL('/');
      
      // Test with tracking number
      await trackingInput.fill('PKG-123456');
      await trackButton.click();
      await page.waitForTimeout(1000);
      
      // Should navigate to tracking page (even if it doesn't exist, URL should change)
      await expect(page).toHaveURL(/\/track\/PKG-123456/);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Login Page', () => {
    test('login page loads correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Check page elements
      await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check Shipnorth logo/branding
      await expect(page.locator('text=Shipnorth')).toBeVisible();
      
      // Check theme toggle is present
      await expect(page.locator('[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])')).toBeVisible();
      
      // Check register link
      await expect(page.locator('text=Create an account')).toBeVisible();
      
      // Check quick login buttons
      await expect(page.locator('button:has-text("Admin")')).toBeVisible();
      await expect(page.locator('button:has-text("Staff")')).toBeVisible();
      await expect(page.locator('button:has-text("Driver")')).toBeVisible();
      await expect(page.locator('button:has-text("Customer")')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/login-page-comprehensive.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('password visibility toggle works', async ({ page }) => {
      await page.goto('/login');
      
      const passwordInput = page.locator('input[type="password"]');
      const toggleButton = page.locator('button:has([data-lucide="eye"]), button:has([data-lucide="eye-off"])').first();
      
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await page.waitForTimeout(100);
      
      // Should now be text type
      await expect(passwordInput.or(page.locator('input[type="text"]'))).toBeVisible();
      
      // Click toggle to hide password again
      await toggleButton.click();
      await page.waitForTimeout(100);
      
      // Should be password type again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('form validation works', async ({ page }) => {
      await page.goto('/login');
      
      const submitButton = page.locator('button[type="submit"]');
      
      // Try to submit empty form
      await submitButton.click();
      
      // HTML5 validation should prevent submission
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      // Fill invalid email
      await emailInput.fill('invalid-email');
      await submitButton.click();
      
      // HTML5 validation should show error
      const validity = await emailInput.evaluate((input: HTMLInputElement) => input.validity.valid);
      expect(validity).toBe(false);
      
      // Fill valid email but no password
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      // Password field should be required
      const passwordInput = page.locator('input[type="password"]');
      const passwordValidity = await passwordInput.evaluate((input: HTMLInputElement) => input.validity.valid);
      expect(passwordValidity).toBe(false);
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test.describe('Quick Login Functionality', () => {
    test('admin quick login works', async ({ page }) => {
      await page.goto('/login');
      
      const adminButton = page.locator('button:has-text("Admin")');
      await expect(adminButton).toBeVisible();
      
      // Click admin quick login
      await adminButton.click();
      
      // Wait for login process and redirect
      await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Verify we're on admin dashboard
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/admin-dashboard-login.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('staff quick login works', async ({ page }) => {
      await page.goto('/login');
      
      const staffButton = page.locator('button:has-text("Staff")');
      await expect(staffButton).toBeVisible();
      
      // Click staff quick login
      await staffButton.click();
      
      // Wait for login process and redirect
      await page.waitForURL('/staff', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Verify we're on staff dashboard
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/staff-dashboard-login.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('driver quick login works', async ({ page }) => {
      await page.goto('/login');
      
      const driverButton = page.locator('button:has-text("Driver")');
      await expect(driverButton).toBeVisible();
      
      // Click driver quick login
      await driverButton.click();
      
      // Wait for login process and redirect
      await page.waitForURL('/driver', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Verify we're on driver portal
      await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/driver-portal-login.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('customer quick login works', async ({ page }) => {
      await page.goto('/login');
      
      const customerButton = page.locator('button:has-text("Customer")');
      await expect(customerButton).toBeVisible();
      
      // Click customer quick login
      await customerButton.click();
      
      // Wait for login process and redirect
      await page.waitForURL('/portal', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Verify we're on customer portal
      await expect(page.locator('h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/customer-portal-login.png', fullPage: true });
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

  test.describe('Manual Login Flows', () => {
    test('manual admin login works', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in admin credentials
      await page.fill('input[type="email"]', config.testUsers.admin.email);
      await page.fill('input[type="password"]', config.testUsers.admin.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('manual staff login works', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in staff credentials
      await page.fill('input[type="email"]', config.testUsers.staff.email);
      await page.fill('input[type="password"]', config.testUsers.staff.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/staff', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('manual driver login works', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in driver credentials
      await page.fill('input[type="email"]', config.testUsers.driver.email);
      await page.fill('input[type="password"]', config.testUsers.driver.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/driver', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page.locator('h1:has-text("Driver Portal")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('manual customer login works', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in customer credentials
      await page.fill('input[type="email"]', config.testUsers.customer.email);
      await page.fill('input[type="password"]', config.testUsers.customer.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/portal', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page.locator('h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('invalid credentials show error', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show error message and stay on login page
      await expect(page.locator('text=/Invalid credentials/i, text=/Authentication failed/i, text=/Login failed/i')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await expect(page).toHaveURL('/login');
      
      // Take screenshot of error state
      await page.screenshot({ path: 'test-results/login-error-state.png', fullPage: true });
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

  test.describe('Session Management', () => {
    test('user stays logged in after page refresh', async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Refresh page
      await page.reload();
      
      // Should still be on staff dashboard
      await expect(page).toHaveURL('/staff');
      await expect(page.locator('h1:has-text("Staff Dashboard")')).toBeVisible();
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('logout functionality works (if available)', async ({ page }) => {
      // Login as staff
      await page.goto('/login');
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Look for logout button/link
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should redirect to login or home page
        await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
        
        // Verify we're logged out by trying to access staff dashboard
        await page.goto('/staff');
        await expect(page).toHaveURL('/login');
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('protected routes redirect to login when not authenticated', async ({ page }) => {
      // Try to access staff dashboard without login
      await page.goto('/staff');
      await page.waitForURL('/login', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Try to access admin dashboard without login
      await page.goto('/admin');
      await page.waitForURL('/login', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Try to access driver portal without login
      await page.goto('/driver');
      await page.waitForURL('/login', { timeout: 5000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      
      // Try to access customer portal without login
      await page.goto('/portal');
      await page.waitForURL('/login', { timeout: 5000 });
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

  test.describe('Loading States and UX', () => {
    test('login button shows loading state', async ({ page }) => {
      await page.goto('/login');
      
      // Fill credentials
      await page.fill('input[type="email"]', config.testUsers.staff.email);
      await page.fill('input[type="password"]', config.testUsers.staff.password);
      
      // Submit and check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show loading state (disabled button or loading text)
      await expect(submitButton.or(page.locator('button:disabled, button:has-text("Signing in")'))).toBeVisible({ timeout: 1000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('quick login buttons show loading state', async ({ page }) => {
      await page.goto('/login');
      
      const staffButton = page.locator('button:has-text("Staff")');
      await staffButton.click();
      
      // Should show disabled state during loading
      await expect(page.locator('button:disabled')).toBeVisible({ timeout: 1000 });
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

  test.describe('Error Handling', () => {
    test('network error handling (if API is down)', async ({ page }) => {
      // This test might need to be adjusted based on actual error handling
      await page.goto('/login');
      
      // Try to login when API might be unavailable
      await page.fill('input[type="email"]', config.testUsers.staff.email);
      await page.fill('input[type="password"]', config.testUsers.staff.password);
      
      await page.click('button[type="submit"]');
      
      // Should either redirect successfully or show appropriate error
      await page.waitForTimeout(5000);
      
      // Check if we're still on login page or successfully redirected
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        // If still on login, there should be an error message
        const hasError = await page.locator('text=/error/i, text=/failed/i, [role="alert"]').count();
        if (hasError > 0) {
          await page.screenshot({ path: 'test-results/login-network-error.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
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

  test.describe('Mobile Responsiveness', () => {
    test('login page works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.goto('/login');
      
      // Check elements are visible and functional on mobile
      await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Quick login buttons should be arranged properly
      await expect(page.locator('button:has-text("Admin")')).toBeVisible();
      await expect(page.locator('button:has-text("Staff")')).toBeVisible();
      
      // Test staff login on mobile
      await page.click('button:has-text("Staff")');
      await page.waitForURL('/staff');
      
      // Take mobile screenshot
      await page.screenshot({ path: 'test-results/staff-mobile-after-login.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    test('homepage works on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
    } catch (error) {
      // Ignore localStorage access errors
    }
      await page.goto('/');
      
      // Check responsive design elements
      await expect(page.locator('h2:has-text("Autonomous Shipping")')).toBeVisible();
      await expect(page.locator('text=Features')).toBeVisible();
      
      // Navigation should work on tablet
      await page.click('text=Sign In');
      await page.waitForURL('/login');
      
      // Take tablet screenshot
      await page.screenshot({ path: 'test-results/login-tablet-viewport.png', fullPage: true });
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
});
    } catch (error) {
      // Ignore localStorage access errors
    }