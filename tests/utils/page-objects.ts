import { Page, Locator } from '@playwright/test';

/**
 * Page Object Models for consistent element interaction
 * Reduces code duplication and improves maintainability
 */

export class BasePage {
  constructor(protected page: Page) {}

  // Common navigation elements
  get themeToggle() {
    return this.page
      .locator(
        '[data-testid="theme-toggle"], button:has([data-lucide="sun"]), button:has([data-lucide="moon"])'
      )
      .first();
  }

  get signInButton() {
    return this.page.locator('text=Sign In');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}

export class LoginPage extends BasePage {
  // Form elements
  get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[type="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get passwordToggle() {
    return this.page
      .locator('button:has([data-lucide="eye"]), button:has([data-lucide="eye-off"])')
      .first();
  }

  // Quick login buttons
  get adminQuickLogin() {
    return this.page.locator('button:has-text("Admin")');
  }

  get staffQuickLogin() {
    return this.page.locator('button:has-text("Staff")');
  }

  get driverQuickLogin() {
    return this.page.locator('button:has-text("Driver")');
  }

  get customerQuickLogin() {
    return this.page.locator('button:has-text("Customer")');
  }

  // Links and other elements
  get registerLink() {
    return this.page.locator('text=Create an account');
  }

  get welcomeHeading() {
    return this.page.locator('h2:has-text("Welcome back")');
  }

  get shipnorthLogo() {
    return this.page.locator('text=Shipnorth');
  }

  // Actions
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }
}

export class HomePage extends BasePage {
  // Main content
  get heroHeading() {
    return this.page.locator('h2:has-text("Autonomous Shipping")');
  }

  get featuresLink() {
    return this.page.locator('text=Features');
  }

  get howItWorksLink() {
    return this.page.locator('text=How It Works');
  }

  get pricingLink() {
    return this.page.locator('text=Pricing');
  }

  get getStartedButton() {
    return this.page.locator('text=Get Started');
  }

  // Tracking form
  get trackingInput() {
    return this.page.locator('input[placeholder*="tracking"]');
  }

  get trackButton() {
    return this.page.locator('button:has-text("Track Package")');
  }

  // Actions
  async trackPackage(trackingNumber: string) {
    await this.trackingInput.fill(trackingNumber);
    await this.trackButton.click();
  }
}

export class StaffDashboard extends BasePage {
  // Navigation tabs
  get overviewTab() {
    return this.page.locator('button:has-text("overview")');
  }

  get packagesTab() {
    return this.page.locator('button:has-text("packages")');
  }

  get customersTab() {
    return this.page.locator('button:has-text("customers")');
  }

  get loadsTab() {
    return this.page.locator('button:has-text("loads")');
  }

  get invoicesTab() {
    return this.page.locator('button:has-text("invoices")');
  }

  // Overview stats
  get totalPackagesCard() {
    return this.page.locator('text=Total Packages');
  }

  get activeCustomersCard() {
    return this.page.locator('text=Active Customers');
  }

  get activeLoadsCard() {
    return this.page.locator('text=Active Loads');
  }

  get revenueCard() {
    return this.page.locator('text=Revenue');
  }

  // Package section elements
  get addPackageButton() {
    return this.page.locator('button:has-text("Add Package")');
  }

  get packagesTable() {
    return this.page.locator('table');
  }

  get exportButton() {
    return this.page.locator('button:has-text("Export")');
  }

  get printButton() {
    return this.page.locator('button:has-text("Print")');
  }

  // Customer section elements
  get addCustomerButton() {
    return this.page.locator('button:has-text("Add Customer")');
  }

  get customersTable() {
    return this.page.locator('table');
  }

  // Loads section elements
  get createLoadButton() {
    return this.page.locator('button:has-text("Create Load")');
  }

  get loadsTable() {
    return this.page.locator('table');
  }

  // Actions
  async navigateToTab(tab: 'overview' | 'packages' | 'customers' | 'loads' | 'invoices') {
    await this.page.click(`button:has-text("${tab}")`);
    await this.page.waitForTimeout(1000);
  }

  async selectAllPackages() {
    const selectAllCheckbox = this.page.locator('th input[type="checkbox"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
    }
  }
}

export class CustomerPortal extends BasePage {
  // Portal elements
  get welcomeHeading() {
    return this.page.locator(
      'h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")'
    );
  }

  get userEmail() {
    return this.page.locator('[data-testid="user-email"]');
  }

  get customerDashboard() {
    return this.page.locator('[data-testid="customer-dashboard"]');
  }

  get logoutButton() {
    return this.page.locator('[data-testid="logout-button"]');
  }

  // Package tracking
  get trackingForm() {
    return this.page.locator('form');
  }

  get trackingInput() {
    return this.page.locator('input[placeholder*="tracking"]');
  }

  get trackButton() {
    return this.page.locator('button:has-text("Track")');
  }

  // Package list
  get packagesList() {
    return this.page.locator('[data-testid="packages-list"]');
  }

  // Actions
  async trackPackage(trackingNumber: string) {
    await this.trackingInput.fill(trackingNumber);
    await this.trackButton.click();
  }
}

export class DriverPortal extends BasePage {
  // Portal elements
  get portalHeading() {
    return this.page.locator('h1:has-text("Driver Portal")');
  }

  get currentLoadSection() {
    return this.page.locator('[data-testid="current-load"]');
  }

  // Mobile scanning elements
  get scanButton() {
    return this.page.locator('button:has-text("Scan"), button:has([data-lucide="scan"])');
  }

  get cameraButton() {
    return this.page.locator('button:has-text("Camera"), button:has([data-lucide="camera"])');
  }

  get gpsButton() {
    return this.page.locator('button:has-text("GPS"), button:has([data-lucide="map-pin"])');
  }

  // Signature capture
  get signatureCanvas() {
    return this.page.locator('canvas[data-testid="signature-canvas"]');
  }

  get clearSignatureButton() {
    return this.page.locator('button:has-text("Clear")');
  }

  get saveSignatureButton() {
    return this.page.locator('button:has-text("Save Signature")');
  }

  // Package actions
  get packageList() {
    return this.page.locator('[data-testid="package-list"]');
  }

  get deliverButton() {
    return this.page.locator('button:has-text("Deliver")');
  }

  get exceptionButton() {
    return this.page.locator('button:has-text("Exception")');
  }

  // Actions
  async captureSignature() {
    const canvas = this.signatureCanvas;
    if (await canvas.isVisible()) {
      // Simulate signature drawing
      const box = await canvas.boundingBox();
      if (box) {
        await this.page.mouse.move(box.x + 50, box.y + 50);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + 150, box.y + 100);
        await this.page.mouse.up();
      }
    }
  }
}

export class AdminPanel extends BasePage {
  // Admin dashboard
  get dashboardHeading() {
    return this.page.locator('h1:has-text("Admin Dashboard")');
  }

  // User management
  get usersTab() {
    return this.page.locator('button:has-text("Users"), a:has-text("Users")');
  }

  get addUserButton() {
    return this.page.locator('button:has-text("Add User")');
  }

  get usersTable() {
    return this.page.locator('table');
  }

  // System settings
  get settingsTab() {
    return this.page.locator('button:has-text("Settings"), a:has-text("Settings")');
  }

  get configurationSection() {
    return this.page.locator('[data-testid="configuration"]');
  }

  // Reports
  get reportsTab() {
    return this.page.locator('button:has-text("Reports"), a:has-text("Reports")');
  }

  get generateReportButton() {
    return this.page.locator('button:has-text("Generate Report")');
  }

  // Actions
  async navigateToSection(section: 'users' | 'settings' | 'reports') {
    await this.page.click(`button:has-text("${section}"), a:has-text("${section}")`);
    await this.page.waitForTimeout(1000);
  }
}

export class DocumentationPage extends BasePage {
  // Documentation elements
  get docsHeading() {
    return this.page.locator('h1');
  }

  get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search"]');
  }

  get searchButton() {
    return this.page.locator('button:has-text("Search")');
  }

  get navigationMenu() {
    return this.page.locator('nav');
  }

  get contentSection() {
    return this.page.locator('main, .content');
  }

  // Global search elements
  get globalSearchModal() {
    return this.page.locator('[role="dialog"]');
  }

  get searchResults() {
    return this.page.locator('[data-testid="search-results"]');
  }

  // Actions
  async performSearch(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async openGlobalSearch() {
    // Trigger global search (usually Cmd+K or Ctrl+K)
    await this.page.keyboard.press('Meta+KeyK');
  }
}
