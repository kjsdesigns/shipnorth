import { test, expect } from '@playwright/test';

test.describe('Localhost CSS and Theme Tests', () => {
  test('should load homepage with proper styling', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check if page loads
    await expect(page.locator('h1')).toContainText('Shipnorth');
    
    // Check hero section styling
    const heroHeading = page.locator('h2').first();
    await expect(heroHeading).toContainText('Autonomous Shipping');
    
    // Verify buttons have proper styling
    const getStartedBtn = page.locator('text=Get Started').first();
    await expect(getStartedBtn).toBeVisible();
    
    // Check button background color (should be blue)
    const buttonStyle = await getStartedBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding
      };
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    expect(buttonStyle.backgroundColor).toBe('rgb(59, 130, 246)'); // Blue
    expect(buttonStyle.borderRadius).toBe('8px');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'localhost-test.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Find theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀")').first();
    
    if (await themeToggle.isVisible()) {
      // Get initial theme state
      const initialTheme = await page.locator('html').getAttribute('class');
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const newTheme = await page.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
      
      // Check text colors are appropriate for the theme
      const heroText = page.locator('h2').first();
      const textColor = await heroText.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      
      // Should be light color if in dark mode, dark if in light mode
      expect(textColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    }
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should navigate to login page', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Click Sign In button
    await page.click('text=Sign In');
    
    // Should navigate to login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Login page should load with proper styling
    await expect(page.locator('input[type="email"], input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[placeholder*="password"]')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.goto('http://localhost:3001');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.reload();
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }