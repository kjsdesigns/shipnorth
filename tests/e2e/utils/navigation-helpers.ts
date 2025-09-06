import { Page, Locator } from '@playwright/test';

export type PortalType = 'staff' | 'driver' | 'customer' | 'admin';

/**
 * Standardized Navigation Helper
 * Provides consistent, visible navigation selectors across all tests
 */
export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Get visible navigation elements for a specific portal
   * Excludes hidden mobile menu elements and focuses on main navigation
   */
  async getVisibleNavigationElements(portalType: PortalType): Promise<Locator[]> {
    let selector: string;
    
    switch (portalType) {
      case 'staff':
        selector = [
          'a[href*="/staff/"]:visible',
          'a:has-text("Dashboard"):visible', 
          'a:has-text("Customers"):visible',
          'a:has-text("Packages"):visible', 
          'a:has-text("Loads"):visible',
          'a:has-text("Invoices"):visible',
          '[data-testid*="nav-"]:visible' // Semantic test IDs
        ].join(', ');
        break;
        
      case 'driver':
        selector = [
          'a[href*="/driver/"]:visible',
          'a:has-text("Dashboard"):visible',
          'a:has-text("Loads"):visible',
          'a:has-text("Routes"):visible', 
          'a:has-text("Deliveries"):visible',
          'a:has-text("Earnings"):visible',
          '[data-testid*="driver-nav-"]:visible'
        ].join(', ');
        break;
        
      case 'customer':
        selector = [
          'a[href*="/portal/"]:visible',
          'a:has-text("Tracking"):visible',
          'a:has-text("Packages"):visible',
          'a:has-text("Account"):visible',
          'a:has-text("Billing"):visible',
          '[data-testid*="customer-nav-"]:visible'
        ].join(', ');
        break;
        
      case 'admin':
        selector = [
          'a[href*="/staff/admin/"]:visible',
          'a:has-text("Users"):visible',
          'a:has-text("Settings"):visible', 
          'a:has-text("Analytics"):visible',
          'a:has-text("Audit"):visible',
          '[data-testid*="admin-nav-"]:visible'
        ].join(', ');
        break;
        
      default:
        throw new Error(`Unknown portal type: ${portalType}`);
    }
    
    return await this.page.locator(selector).all();
  }

  /**
   * Find navigation element by text content
   * Only searches within visible navigation elements
   */
  async findNavigationByText(portalType: PortalType, text: string): Promise<Locator | null> {
    const navElements = await this.getVisibleNavigationElements(portalType);
    
    for (const element of navElements) {
      const content = await element.textContent();
      if (content?.toLowerCase().includes(text.toLowerCase())) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * Navigate to a specific section within a portal
   * Handles waiting for navigation and URL updates
   */
  async navigateTo(portalType: PortalType, sectionName: string): Promise<boolean> {
    const navElement = await this.findNavigationByText(portalType, sectionName);
    
    if (!navElement) {
      console.log(`❌ Navigation element not found: "${sectionName}" in ${portalType} portal`);
      return false;
    }
    
    const currentUrl = this.page.url();
    
    try {
      // Get navigation details for logging
      const text = await navElement.textContent();
      const href = await navElement.getAttribute('href');
      
      console.log(`🔗 Navigating to: "${text}" → ${href}`);
      
      // Click and wait for navigation
      await navElement.click();
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Verify navigation succeeded
      const newUrl = this.page.url();
      if (newUrl !== currentUrl) {
        console.log(`✅ Navigation successful: ${newUrl}`);
        return true;
      } else {
        console.log(`⚠️ URL didn't change after navigation click`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Navigation failed: ${error}`);
      return false;
    }
  }

  /**
   * Verify navigation elements are present and visible
   * Useful for smoke tests
   */
  async verifyNavigationPresent(portalType: PortalType, expectedSections: string[]): Promise<boolean> {
    const navElements = await this.getVisibleNavigationElements(portalType);
    
    if (navElements.length === 0) {
      console.log(`❌ No navigation elements found for ${portalType} portal`);
      return false;
    }
    
    console.log(`📋 Found ${navElements.length} navigation elements in ${portalType} portal`);
    
    // Check if expected sections are present
    const missingSection: string[] = [];
    
    for (const section of expectedSections) {
      const found = await this.findNavigationByText(portalType, section);
      if (!found) {
        missingSection.push(section);
      }
    }
    
    if (missingSection.length > 0) {
      console.log(`❌ Missing navigation sections: ${missingSection.join(', ')}`);
      return false;
    }
    
    console.log(`✅ All expected navigation sections present`);
    return true;
  }

  /**
   * LEGACY SELECTOR WARNING
   * This method should NOT be used - kept only for reference
   * @deprecated Use getVisibleNavigationElements instead
   */
  private getLegacyProblematicSelector(): string {
    // ❌ NEVER USE THESE SELECTORS - they target hidden elements:
    // 'nav a, [role="navigation"] a, sidebar a, button'
    // This causes tests to click on hidden mobile menu buttons
    
    throw new Error('Legacy navigation selectors are deprecated. Use getVisibleNavigationElements() instead.');
  }
}

/**
 * Quick helper function for common navigation tasks
 */
export async function quickNavigate(page: Page, portalType: PortalType, sectionName: string): Promise<boolean> {
  const navHelper = new NavigationHelpers(page);
  return await navHelper.navigateTo(portalType, sectionName);
}

/**
 * Expected navigation sections for each portal type
 */
export const EXPECTED_NAVIGATION = {
  staff: ['Dashboard', 'Customers', 'Packages', 'Loads'],
  driver: ['Dashboard', 'Loads', 'Routes', 'Deliveries'],
  customer: ['Tracking', 'Packages', 'Account'],
  admin: ['Users', 'Settings', 'Analytics']
} as const;