import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/${name}.png`,
      fullPage: true,
    });
  }

  get themeToggle(): Locator {
    return this.page.getByRole('button', { name: /dark mode|light mode|system/i }).first();
  }
}

export class HomePage extends BasePage {
  get heroHeading(): Locator {
    return this.page.locator('h2:has-text("Autonomous Shipping")');
  }

  get featuresLink(): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: 'Features' });
  }

  get howItWorksLink(): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: 'How It Works' });
  }

  get pricingLink(): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: 'Pricing' });
  }

  get signInButton(): Locator {
    return this.page.locator('text=Sign In').first();
  }

  get trackingInput(): Locator {
    return this.page.locator('input[placeholder*="tracking"]');
  }

  get trackButton(): Locator {
    return this.page.locator('button:has-text("Track Package")');
  }

  get getStartedButton(): Locator {
    return this.page.locator('text=Get Started');
  }

  async trackPackage(trackingNumber: string): Promise<void> {
    await this.trackingInput.fill(trackingNumber);
    await this.trackButton.click();
  }
}

export class LoginPage extends BasePage {
  get welcomeHeading(): Locator {
    return this.page.locator('h2:has-text("Welcome back")');
  }

  get emailInput(): Locator {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  get shipnorthLogo(): Locator {
    return this.page.locator('text=Shipnorth');
  }

  get registerLink(): Locator {
    return this.page.locator('text=Create an account');
  }

  get passwordToggle(): Locator {
    return this.page
      .locator('button:has([data-lucide="eye"]), button:has([data-lucide="eye-off"])')
      .first();
  }

  get adminQuickLogin(): Locator {
    return this.page.locator('button:has-text("Admin")');
  }

  get staffQuickLogin(): Locator {
    return this.page.locator('button:has-text("Staff")');
  }

  get driverQuickLogin(): Locator {
    return this.page.locator('button:has-text("Driver")');
  }

  get customerQuickLogin(): Locator {
    return this.page.locator('button:has-text("Customer")');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }
}

export class StaffDashboard extends BasePage {
  get mainHeading(): Locator {
    return this.page.locator('h1:has-text("Staff Dashboard")');
  }

  get totalPackagesCard(): Locator {
    return this.page.locator('text=Total Packages');
  }

  get activeCustomersCard(): Locator {
    return this.page.locator('text=Active Customers');
  }

  get activeLoadsCard(): Locator {
    return this.page.locator('text=Active Loads');
  }

  get revenueCard(): Locator {
    return this.page.locator('text=Revenue');
  }

  get overviewTab(): Locator {
    return this.page.locator('button:has-text("Overview"), a:has-text("Overview")').first();
  }

  get packagesTab(): Locator {
    return this.page.locator('button:has-text("Packages"), a:has-text("Packages")').first();
  }

  get customersTab(): Locator {
    return this.page.locator('button:has-text("Customers"), a:has-text("Customers")').first();
  }

  get loadsTab(): Locator {
    return this.page.locator('button:has-text("Loads"), a:has-text("Loads")').first();
  }

  get invoicesTab(): Locator {
    return this.page.locator('button:has-text("Invoices"), a:has-text("Invoices")').first();
  }

  get addPackageButton(): Locator {
    return this.page.locator('button:has-text("Add Package"), button:has-text("New Package")');
  }

  get addCustomerButton(): Locator {
    return this.page.locator('button:has-text("Add Customer"), button:has-text("New Customer")');
  }

  get packagesTable(): Locator {
    return this.page.locator('table').first();
  }

  get customersTable(): Locator {
    return this.page.locator('table').nth(1);
  }

  async navigateToTab(
    tabName: 'overview' | 'packages' | 'customers' | 'loads' | 'invoices'
  ): Promise<void> {
    const tab = this.getTabByName(tabName);
    await tab.click();
    await this.page.waitForTimeout(500); // Allow tab content to load
  }

  getTabByName(tabName: string): Locator {
    switch (tabName) {
      case 'overview':
        return this.overviewTab;
      case 'packages':
        return this.packagesTab;
      case 'customers':
        return this.customersTab;
      case 'loads':
        return this.loadsTab;
      case 'invoices':
        return this.invoicesTab;
      default:
        throw new Error(`Unknown tab: ${tabName}`);
    }
  }
}

export class CustomerPortal extends BasePage {
  get mainHeading(): Locator {
    return this.page.locator(
      'h1:has-text("Shipnorth"), h1:has-text("Customer Portal"), h1:has-text("Your Packages")'
    );
  }

  get trackingInput(): Locator {
    return this.page.locator('input[placeholder*="tracking"]');
  }

  get trackButton(): Locator {
    return this.page.locator('button:has-text("Track")').first();
  }

  get packagesTable(): Locator {
    return this.page.locator('table');
  }

  get noPackagesMessage(): Locator {
    return this.page.locator('text=No packages found, text=You have no active packages');
  }

  async trackPackage(trackingNumber: string): Promise<void> {
    await this.trackingInput.fill(trackingNumber);
    await this.trackButton.click();
  }
}

export class DriverPortal extends BasePage {
  get mainHeading(): Locator {
    return this.page.locator('h1:has-text("Driver Portal")');
  }

  get gpsStatus(): Locator {
    return this.page.locator('[data-testid="gps-status"], text=GPS Status');
  }

  get scanButton(): Locator {
    return this.page.locator('button:has-text("Scan"), [data-testid="scan-button"]');
  }

  get photoButton(): Locator {
    return this.page.locator('button:has-text("Take Photo"), [data-testid="photo-button"]');
  }

  get signatureButton(): Locator {
    return this.page.locator('button:has-text("Signature"), [data-testid="signature-button"]');
  }

  get manifestList(): Locator {
    return this.page.locator('[data-testid="manifest-list"], .manifest-list');
  }

  get deliveryButton(): Locator {
    return this.page.locator(
      'button:has-text("Mark Delivered"), button:has-text("Complete Delivery")'
    );
  }

  async scanPackage(trackingNumber: string): Promise<void> {
    await this.scanButton.click();
    // Simulate barcode scan input
    await this.page.fill(
      'input[data-testid="barcode-input"], input[placeholder*="barcode"]',
      trackingNumber
    );
    await this.page.click('button:has-text("Submit"), button:has-text("Confirm")');
  }
}

export class AdminPanel extends BasePage {
  get mainHeading(): Locator {
    return this.page.locator('h1:has-text("Admin Dashboard")');
  }

  get userManagementSection(): Locator {
    return this.page.locator('[data-testid="user-management"], text=User Management');
  }

  get addUserButton(): Locator {
    return this.page.locator('button:has-text("Add User"), button:has-text("Create User")');
  }

  get usersTable(): Locator {
    return this.page.locator('table').first();
  }

  get systemSettingsTab(): Locator {
    return this.page.locator('button:has-text("Settings"), a:has-text("Settings")');
  }

  get reportsTab(): Locator {
    return this.page.locator('button:has-text("Reports"), a:has-text("Reports")');
  }

  async navigateToUserManagement(): Promise<void> {
    await this.userManagementSection.click();
  }

  async addNewUser(email: string, role: string): Promise<void> {
    await this.addUserButton.click();
    await this.page.fill('input[name="email"], input[placeholder*="email"]', email);
    await this.page.selectOption('select[name="role"], select[data-testid="role-select"]', role);
    await this.page.click('button:has-text("Save"), button:has-text("Create")');
  }
}

export class DocumentationPage extends BasePage {
  get searchInput(): Locator {
    return this.page.locator('input[placeholder*="search"], [data-testid="search-input"]');
  }

  get searchResults(): Locator {
    return this.page.locator('[data-testid="search-results"], .search-results');
  }

  get navigationMenu(): Locator {
    return this.page.locator('[data-testid="doc-nav"], .doc-navigation');
  }

  get apiSpecSection(): Locator {
    return this.page.locator('text=API Specification, text=OpenAPI');
  }

  async performSearch(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }
}
