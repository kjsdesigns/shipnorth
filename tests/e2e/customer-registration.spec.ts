import { test, expect } from '@playwright/test';

test.describe('Customer Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Stripe
    await page.addInitScript(() => {
      (window as any).Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            unmount: () => {},
            on: () => {},
          }),
          getElement: () => ({
            getValue: () => ({ complete: true }),
          }),
        }),
        confirmCardSetup: () => Promise.resolve({ 
          setupIntent: { id: 'seti_test123', status: 'succeeded' },
          error: null 
        }),
      });
    });

    // Mock registration APIs
    await page.route('**/customers/register', async (route) => {
      const body = await route.request().postDataJSON();
      
      if (body.email === 'existing@example.com') {
        await route.fulfill({
          status: 409,
          json: {
            error: 'Customer already exists',
            message: 'An account with this email already exists. Please sign in instead.',
            loginSuggested: true,
            email: body.email,
          }
        });
      } else {
        await route.fulfill({
          status: 201,
          json: {
            customer: {
              id: 'cust_new123',
              firstName: body.firstName,
              lastName: body.lastName,
              email: body.email,
            },
            setupIntent: {
              client_secret: 'seti_test123_secret',
              id: 'seti_test123',
            },
            message: 'Registration successful. Please add a payment method to complete setup.',
          }
        });
      }
    });

    await page.route('**/customers/complete-registration', async (route) => {
      await route.fulfill({
        json: {
          message: 'Registration completed successfully',
          customer: { id: 'cust_new123', status: 'active' },
        }
      });
    });
  });

  test('should complete full registration flow', async ({ page }) => {
    await page.goto('/register');

    // Step 1: Personal Information
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 123-4567');
    
    await page.click('button:has-text("Continue to Address")');

    // Step 2: Address Information
    await expect(page.locator('h2:has-text("Shipping Address")')).toBeVisible();
    
    await page.fill('input[name="addressLine1"]', '123 Main Street');
    await page.fill('input[name="addressLine2"]', 'Apt 4B');
    await page.fill('input[name="city"]', 'Toronto');
    await page.selectOption('select[name="province"]', 'ON');
    await page.fill('input[name="postalCode"]', 'M5V 1A1');
    
    await page.click('button:has-text("Continue to Review")');

    // Step 3: Review Information
    await expect(page.locator('h2:has-text("Review & Create Account")')).toBeVisible();
    
    // Verify information is displayed correctly
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john.doe@example.com')).toBeVisible();
    await expect(page.locator('text=123 Main Street')).toBeVisible();
    await expect(page.locator('text=Toronto, ON M5V 1A1')).toBeVisible();
    
    await page.click('button:has-text("Create Account")');
    await page.waitForLoadState('networkidle');

    // Step 4: Payment Method
    await expect(page.locator('h2:has-text("Add Payment Method")')).toBeVisible();
    
    // Mock successful payment setup
    await page.click('button:has-text("Complete Registration")');
    await page.waitForLoadState('networkidle');

    // Step 5: Success
    await expect(page.locator('h2:has-text("Welcome to Shipnorth!")')).toBeVisible();
    await expect(page.locator('text=Your account has been created successfully')).toBeVisible();
    
    // Check that next steps are shown
    await expect(page.locator('text=Access your customer portal')).toBeVisible();
    await expect(page.locator('text=View real-time location updates')).toBeVisible();
    await expect(page.locator('text=Receive SMS and email notifications')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('a:has-text("Sign In to Your Account")')).toBeVisible();
    await expect(page.locator('a:has-text("Return Home")')).toBeVisible();
  });

  test('should handle existing customer email', async ({ page }) => {
    await page.goto('/register');

    // Fill out form with existing email
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 987-6543');
    
    await page.click('button:has-text("Continue to Address")');

    // Complete address
    await page.fill('input[name="addressLine1"]', '456 Oak Avenue');
    await page.fill('input[name="city"]', 'Vancouver');
    await page.selectOption('select[name="province"]', 'BC');
    await page.fill('input[name="postalCode"]', 'V6B 1A1');
    
    await page.click('button:has-text("Continue to Review")');
    await page.click('button:has-text("Create Account")');
    await page.waitForLoadState('networkidle');

    // Should redirect to login with pre-filled email
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toHaveValue('existing@example.com');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');

    // Try to continue without filling required fields
    await page.click('button:has-text("Continue to Address")');
    
    // Should show error message
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();
    
    // Fill partial information
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    // Missing email and phone
    
    await page.click('button:has-text("Continue to Address")');
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();
  });

  test('should support navigation between steps', async ({ page }) => {
    await page.goto('/register');

    // Complete step 1
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');
    await page.click('button:has-text("Continue to Address")');

    // Go back to step 1
    await page.click('button:has-text("Back")');
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    
    // Verify data is preserved
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Test');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
  });

  test('should show progress indicator correctly', async ({ page }) => {
    await page.goto('/register');

    // Check initial progress (step 1)
    const progressBar = page.locator('.bg-blue-600.h-2');
    await expect(progressBar).toHaveCSS('width', '0%');

    // Progress to step 2
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User'); 
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');
    await page.click('button:has-text("Continue to Address")');

    // Check progress updated
    await expect(progressBar).toHaveCSS('width', '25%');

    // Step numbers should be updated
    const step1Indicator = page.locator('div:has-text("1")').first();
    const step2Indicator = page.locator('div:has-text("2")').first();
    
    await expect(step1Indicator).toHaveClass(/bg-blue-600/);
    await expect(step2Indicator).toHaveClass(/bg-blue-600/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');

    // Form should be visible and usable on mobile
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    
    // Progress indicator should be visible
    await expect(page.locator('.bg-blue-600.h-2')).toBeVisible();
    
    // Buttons should be accessible
    await expect(page.locator('button:has-text("Continue to Address")')).toBeVisible();
  });

  test('should validate address fields correctly', async ({ page }) => {
    await page.goto('/register');

    // Complete step 1
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');
    await page.click('button:has-text("Continue to Address")');

    // Try to continue without required address fields
    await page.click('button:has-text("Continue to Review")');
    
    await expect(page.locator('text=Please fill in all required address fields')).toBeVisible();
    
    // Fill partial address
    await page.fill('input[name="addressLine1"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    // Missing province and postal code
    
    await page.click('button:has-text("Continue to Review")');
    await expect(page.locator('text=Please fill in all required address fields')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/customers/register', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Internal server error' }
      });
    });

    await page.goto('/register');

    // Complete all steps up to registration
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');
    await page.click('button:has-text("Continue to Address")');

    await page.fill('input[name="addressLine1"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    await page.selectOption('select[name="province"]', 'ON');
    await page.fill('input[name="postalCode"]', 'M1M 1M1');
    await page.click('button:has-text("Continue to Review")');

    await page.click('button:has-text("Create Account")');
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('text=Registration failed. Please try again.')).toBeVisible();
    
    // Should stay on review step
    await expect(page.locator('h2:has-text("Review & Create Account")')).toBeVisible();
  });

  test('should show loading states correctly', async ({ page }) => {
    // Mock slow API response
    await page.route('**/customers/register', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 201,
        json: {
          customer: { id: 'cust_new123' },
          setupIntent: { client_secret: 'test_secret', id: 'seti_123' },
        }
      });
    });

    await page.goto('/register');

    // Complete form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');
    await page.click('button:has-text("Continue to Address")');

    await page.fill('input[name="addressLine1"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    await page.selectOption('select[name="province"]', 'ON');
    await page.fill('input[name="postalCode"]', 'M1M 1M1');
    await page.click('button:has-text("Continue to Review")');

    // Click create account
    await page.click('button:has-text("Create Account")');
    
    // Should show loading state
    await expect(page.locator('button:has-text("Creating Account...")')).toBeVisible();
    await expect(page.locator('button:has-text("Creating Account...")')).toBeDisabled();
    
    // Wait for completion
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2:has-text("Add Payment Method")')).toBeVisible();
  });
});

test.describe('Customer Registration Error Cases', () => {
  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/customers/register', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/register');

    // Complete form and submit
    await page.fill('input[name="firstName"]', 'Network');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'network@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 999-8888');
    await page.click('button:has-text("Continue to Address")');

    await page.fill('input[name="addressLine1"]', '123 Network St');
    await page.fill('input[name="city"]', 'Network City');
    await page.selectOption('select[name="province"]', 'ON');
    await page.fill('input[name="postalCode"]', 'N1N 1N1');
    await page.click('button:has-text("Continue to Review")');

    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);

    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '+1 (555) 111-2222');

    // Browser validation should prevent submission
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Try to submit - browser should show validation error
    await page.click('button:has-text("Continue to Address")');
    // Browser validation will handle this
  });

  test('should handle Stripe payment errors', async ({ page }) => {
    // Mock registration success but payment failure
    await page.route('**/customers/register', async (route) => {
      await route.fulfill({
        status: 201,
        json: {
          customer: { id: 'cust_payment_fail' },
          setupIntent: { client_secret: 'fail_secret', id: 'seti_fail' },
        }
      });
    });

    // Override Stripe mock to return error
    await page.addInitScript(() => {
      (window as any).Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            unmount: () => {},
            on: () => {},
          }),
          getElement: () => ({}),
        }),
        confirmCardSetup: () => Promise.resolve({ 
          error: { message: 'Your card was declined.' }
        }),
      });
    });

    await page.goto('/register');

    // Complete registration flow
    await page.fill('input[name="firstName"]', 'Payment');
    await page.fill('input[name="lastName"]', 'Error');
    await page.fill('input[name="email"]', 'payment.error@example.com');
    await page.fill('input[name="phone"]', '+1 (555) 777-8888');
    await page.click('button:has-text("Continue to Address")');

    await page.fill('input[name="addressLine1"]', '123 Payment St');
    await page.fill('input[name="city"]', 'Error City');
    await page.selectOption('select[name="province"]', 'BC');
    await page.fill('input[name="postalCode"]', 'V1V 1V1');
    await page.click('button:has-text("Continue to Review")');
    await page.click('button:has-text("Create Account")');
    await page.waitForLoadState('networkidle');

    // Should reach payment step
    await expect(page.locator('h2:has-text("Add Payment Method")')).toBeVisible();
    
    // Try to complete payment
    await page.click('button:has-text("Complete Registration")');
    await page.waitForTimeout(1000);

    // Should show payment error
    await expect(page.locator('text=Your card was declined.')).toBeVisible();
  });
});