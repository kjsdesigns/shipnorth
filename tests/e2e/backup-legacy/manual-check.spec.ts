import { test, expect } from '@playwright/test';

test.describe('Manual UI Check', () => {
  test('check what user sees at homepage and admin dashboard', async ({ page }) => {
    // Visit homepage first
    await page.goto('/');
    await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    const homepageTitle = await page.locator('h2').first().textContent();
    console.log('Homepage main title:', homepageTitle);
    
    // Check if the homepage has modern styling
    const bodyClasses = await page.locator('body').getAttribute('class');
    console.log('Homepage body classes:', bodyClasses);
    
    // Now login as admin and check the dashboard
    await page.goto('/login');
    await page.screenshot({ path: 'login-screenshot.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.screenshot({ path: 'admin-dashboard-screenshot.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Check what's visible on the admin dashboard
    const adminTitle = await page.locator('h1').first().textContent();
    console.log('Admin dashboard title:', adminTitle);
    
    // Check for specific UI elements
    const sidebarExists = await page.locator('aside, nav').count();
    console.log('Number of sidebar/nav elements:', sidebarExists);
    
    const statsCards = await page.locator('[class*="rounded"], [class*="card"], [class*="bg-white"]').count();
    console.log('Number of card-like elements:', statsCards);
    
    // Check for theme toggle buttons
    const themeButtons = await page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("System")').count();
    console.log('Number of theme toggle buttons:', themeButtons);
    
    // Check for modern styling classes
    const modernElements = await page.locator('[class*="dark:"], [class*="rounded-"], [class*="shadow-"]').count();
    console.log('Number of elements with modern classes:', modernElements);
    
    // Check the actual content structure
    const pageContent = await page.content();
    console.log('Page has ThemeProvider:', pageContent.includes('ThemeProvider'));
    console.log('Page has ModernLayout:', pageContent.includes('ModernLayout'));
    console.log('Page has gradient classes:', pageContent.includes('gradient'));
    console.log('Page has Tailwind dark classes:', pageContent.includes('dark:'));
    
    // Try to identify what layout is actually being used
    const layoutElements = await page.locator('main, .container, .dashboard').count();
    console.log('Number of layout containers:', layoutElements);
    
    // Print current URL for confirmation
    console.log('Current URL:', page.url());
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }