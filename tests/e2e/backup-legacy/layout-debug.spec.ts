import { test, expect } from '@playwright/test';

test.describe('Layout Debug Tests', () => {
  test('check admin dashboard layout and positioning', async ({ page }) => {
    // Enable console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Set viewport to match typical desktop size
    await page.setViewportSize({ width: 1400, height: 800 });
    } catch (error) {
      // Ignore localStorage access errors
    }

    await page.goto('/login');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Take screenshots at different viewport sizes
    await page.screenshot({ path: 'admin-layout-1400x800.png', fullPage: false });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.screenshot({ path: 'admin-layout-full.png', fullPage: true });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Check main container positioning
    const mainContainer = page.locator('main');
    const mainBox = await mainContainer.boundingBox();
    console.log('Main container position:', mainBox);
    
    // Check sidebar positioning  
    const sidebar = page.locator('aside');
    const sidebarBox = await sidebar.boundingBox();
    console.log('Sidebar position:', sidebarBox);
    
    // Check if content is overlapping or positioned incorrectly
    const statsGrid = page.locator('.grid').first();
    const statsBox = await statsGrid.boundingBox();
    console.log('Stats grid position:', statsBox);
    
    // Check the dashboard title position
    const title = page.locator('h1:has-text("Admin Dashboard")');
    const titleBox = await title.boundingBox();
    console.log('Dashboard title position:', titleBox);
    
    // Check individual stat cards
    const firstCard = page.locator('text=Total Revenue').locator('..').locator('..');
    const firstCardBox = await firstCard.boundingBox().catch(() => null);
    console.log('First card position:', firstCardBox);
    
    // Check if cards are visible in viewport
    const cardsInViewport = await page.locator('[class*="rounded-xl"]').count();
    console.log('Cards in viewport:', cardsInViewport);
    
    // Check for any CSS issues
    const computedStyle = await page.locator('main').evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        top: style.top,
        left: style.left,
        marginTop: style.marginTop,
        paddingTop: style.paddingTop,
        height: style.height,
        overflow: style.overflow
      };
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    console.log('Main element computed style:', computedStyle);
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
  
  test('check admin dashboard at different viewport sizes', async ({ page }) => {
    // Test at mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@shipnorth.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.screenshot({ path: 'admin-mobile-375x667.png', fullPage: false });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Test at tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.screenshot({ path: 'admin-tablet-768x1024.png', fullPage: false });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    // Test at large desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    } catch (error) {
      // Ignore localStorage access errors
    }
    await page.screenshot({ path: 'admin-desktop-1920x1080.png', fullPage: false });
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