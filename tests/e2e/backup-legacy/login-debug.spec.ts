import { test, expect } from '@playwright/test';

test.describe('Login Debug Tests', () => {
  test('debug login form submission', async ({ page }) => {
    // Enable console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('/login');
    
    // Take screenshot
    await page.screenshot({ path: 'login-debug-before.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Check current page
    console.log('Current URL:', page.url());
    
    // Find form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Email input visible:', await emailInput.isVisible());
    console.log('Password input visible:', await passwordInput.isVisible());
    console.log('Submit button visible:', await submitButton.isVisible());
    
    // Fill form
    await emailInput.fill('admin@shipnorth.com');
    await passwordInput.fill('admin123');
    
    console.log('Form filled');
    await page.screenshot({ path: 'login-debug-filled.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Click submit and wait
    console.log('Clicking submit button...');
    await submitButton.click();
    
    // Wait a bit to see what happens
    await page.waitForTimeout(3000);
    
    console.log('Current URL after submit:', page.url());
    await page.screenshot({ path: 'login-debug-after.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Check for any error messages
    const errorMessages = await page.locator('[class*="red"], [class*="error"], .error').count();
    console.log('Error message elements found:', errorMessages);
    
    if (errorMessages > 0) {
      const errorText = await page.locator('[class*="red"], [class*="error"], .error').first().textContent();
      console.log('Error text:', errorText);
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }