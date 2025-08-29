import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { AdminPanel } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';

/**
 * Admin Panel - Comprehensive Test Suite
 *
 * Consolidates:
 * - comprehensive-admin.spec.ts
 * - admin-debug.spec.ts
 * - user-management.spec.ts
 *
 * Coverage:
 * - Admin dashboard and overview
 * - User management (create, edit, delete, permissions)
 * - System settings and configuration
 * - Reports and analytics
 * - Security and access control
 * - Audit logs and activity tracking
 * - Data export and backup
 * - Performance monitoring
 * - Error handling and recovery
 */

test.describe('Admin Panel', () => {
  let authHelpers: AuthHelpers;
  let adminPanel: AdminPanel;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    adminPanel = new AdminPanel(page);
    assertions = new CustomAssertions(page);

    // Authenticate as admin
    await authHelpers.quickLogin('admin');
    await authHelpers.waitForLoadingToComplete();
  });

  test.describe('Admin Dashboard and Overview', () => {
    test('should display admin dashboard with key metrics @smoke', async () => {
      await expect(adminPanel.dashboardTitle).toBeVisible();
      await expect(adminPanel.navigationMenu).toBeVisible();

      // Verify key metrics are displayed
      await expect(adminPanel.totalUsersMetric).toBeVisible();
      await expect(adminPanel.totalPackagesMetric).toBeVisible();
      await expect(adminPanel.activeDriversMetric).toBeVisible();
      await expect(adminPanel.systemStatusMetric).toBeVisible();

      // Verify metric values are numeric
      await expect(adminPanel.totalUsersValue).toHaveText(/^\d+$/);
      await expect(adminPanel.totalPackagesValue).toHaveText(/^\d+$/);
      await expect(adminPanel.activeDriversValue).toHaveText(/^\d+$/);
    });

    test('should navigate between admin sections', async () => {
      const sections = [
        { tab: adminPanel.usersTab, content: adminPanel.usersTable },
        { tab: adminPanel.settingsTab, content: adminPanel.settingsForm },
        { tab: adminPanel.reportsTab, content: adminPanel.reportsPanel },
        { tab: adminPanel.auditTab, content: adminPanel.auditLogTable },
        { tab: adminPanel.systemTab, content: adminPanel.systemMonitor },
      ];

      for (const section of sections) {
        await section.tab.click();
        await expect(section.content).toBeVisible();
        await assertions.checkPerformanceMetrics(2000);
      }
    });

    test('should display real-time system status @performance', async () => {
      // Verify real-time updates
      await expect(adminPanel.systemStatusIndicator).toBeVisible();
      await expect(adminPanel.lastUpdateTime).toBeVisible();

      // Wait for status refresh (should update every 30 seconds)
      const initialTime = await adminPanel.lastUpdateTime.textContent();
      await adminPanel.refreshStatusButton.click();
      await expect(adminPanel.lastUpdateTime).not.toHaveText(initialTime);

      // Verify status indicators
      await expect(adminPanel.apiStatusIndicator).toHaveClass(/healthy|warning|error/);
      await expect(adminPanel.databaseStatusIndicator).toHaveClass(/healthy|warning|error/);
      await expect(adminPanel.storageStatusIndicator).toHaveClass(/healthy|warning|error/);
    });

    test('should handle admin dashboard responsiveness @mobile', async ({ page }) => {
      await assertions.testMobileNavigation(page);

      // Test mobile admin interface
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet size

      await expect(adminPanel.mobileMenuButton).toBeVisible();
      await adminPanel.mobileMenuButton.click();
      await expect(adminPanel.mobileNavigationMenu).toBeVisible();

      // Verify critical admin functions are accessible on mobile
      await expect(adminPanel.mobileUsersButton).toBeVisible();
      await expect(adminPanel.mobileSettingsButton).toBeVisible();
      await expect(adminPanel.mobileSystemStatusButton).toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test('should display user list with proper information @users', async () => {
      await adminPanel.usersTab.click();
      await expect(adminPanel.usersTable).toBeVisible();

      // Verify table headers
      await expect(adminPanel.usersTable).toContainText('Name');
      await expect(adminPanel.usersTable).toContainText('Email');
      await expect(adminPanel.usersTable).toContainText('Role');
      await expect(adminPanel.usersTable).toContainText('Status');
      await expect(adminPanel.usersTable).toContainText('Last Login');
      await expect(adminPanel.usersTable).toContainText('Actions');

      // Verify user data is displayed
      await expect(adminPanel.userRows).toHaveCount.greaterThan(0);

      // Test user filtering
      await adminPanel.userRoleFilter.selectOption('staff');
      await expect(adminPanel.userRows.filter({ hasText: 'Staff' })).toBeVisible();

      await adminPanel.userStatusFilter.selectOption('active');
      await expect(adminPanel.userRows.filter({ hasText: 'Active' })).toBeVisible();
    });

    test('should create new user account @users', async () => {
      await adminPanel.usersTab.click();
      await adminPanel.createUserButton.click();

      await expect(adminPanel.createUserModal).toBeVisible();

      // Fill user creation form
      const newUser = TestData.users.newUser;
      await adminPanel.userNameInput.fill(newUser.name);
      await adminPanel.userEmailInput.fill(newUser.email);
      await adminPanel.userRoleSelect.selectOption(newUser.role);
      await adminPanel.userPasswordInput.fill(newUser.password);
      await adminPanel.userPasswordConfirmInput.fill(newUser.password);

      // Submit form
      await adminPanel.createUserSubmitButton.click();

      // Verify success message and user appears in list
      await expect(adminPanel.successMessage).toContainText(/user created successfully/i);
      await expect(adminPanel.usersTable).toContainText(newUser.email);

      // Verify user can login
      await authHelpers.clearStorage();
      await authHelpers.goToLogin();
      await adminPanel.page.fill('input[type="email"]', newUser.email);
      await adminPanel.page.fill('input[type="password"]', newUser.password);
      await adminPanel.page.click('button[type="submit"]');

      const expectedUrl = newUser.role === 'customer' ? '/portal' : `/${newUser.role}`;
      await adminPanel.page.waitForURL(expectedUrl);
    });

    test('should edit existing user account @users', async () => {
      await adminPanel.usersTab.click();

      // Find and edit a test user
      const testUser = adminPanel.userRows.filter({ hasText: config.testUsers.staff.email });
      await testUser.locator(adminPanel.editUserButton).click();

      await expect(adminPanel.editUserModal).toBeVisible();

      // Update user information
      const updatedName = 'Updated Staff Member';
      await adminPanel.userNameInput.fill(updatedName);
      await adminPanel.userStatusSelect.selectOption('inactive');

      await adminPanel.saveUserButton.click();

      // Verify changes
      await expect(adminPanel.successMessage).toContainText(/user updated successfully/i);
      await expect(adminPanel.usersTable).toContainText(updatedName);
      await expect(adminPanel.usersTable).toContainText('Inactive');

      // Revert changes for other tests
      await testUser.locator(adminPanel.editUserButton).click();
      await adminPanel.userNameInput.fill(config.testUsers.staff.name);
      await adminPanel.userStatusSelect.selectOption('active');
      await adminPanel.saveUserButton.click();
    });

    test('should manage user permissions and roles @users @security', async () => {
      await adminPanel.usersTab.click();

      // Edit user permissions
      const testUser = adminPanel.userRows.filter({ hasText: config.testUsers.staff.email });
      await testUser.locator(adminPanel.editUserButton).click();

      // Navigate to permissions tab
      await adminPanel.permissionsTab.click();
      await expect(adminPanel.permissionsGrid).toBeVisible();

      // Test permission toggles
      const packageManagePermission = adminPanel.permissionsGrid.locator(
        '[data-permission="packages:manage"]'
      );
      const initialState = await packageManagePermission.isChecked();

      await packageManagePermission.click();
      await adminPanel.saveUserButton.click();

      // Verify permission change took effect
      await expect(adminPanel.successMessage).toContainText(/permissions updated/i);

      // Verify permission in user context (would need separate test session)
      // This would be tested in integration with the staff interface

      // Revert permission change
      await testUser.locator(adminPanel.editUserButton).click();
      await adminPanel.permissionsTab.click();
      await packageManagePermission.setChecked(initialState);
      await adminPanel.saveUserButton.click();
    });

    test('should disable/enable user accounts @users @security', async () => {
      await adminPanel.usersTab.click();

      const testUser = adminPanel.userRows.filter({ hasText: 'test-disable@example.com' });

      if ((await testUser.count()) === 0) {
        // Create test user for disabling
        await adminPanel.createUserButton.click();
        await adminPanel.userNameInput.fill('Test Disable User');
        await adminPanel.userEmailInput.fill('test-disable@example.com');
        await adminPanel.userRoleSelect.selectOption('staff');
        await adminPanel.userPasswordInput.fill('testpassword');
        await adminPanel.userPasswordConfirmInput.fill('testpassword');
        await adminPanel.createUserSubmitButton.click();
      }

      // Disable user account
      await testUser.locator(adminPanel.disableUserButton).click();
      await expect(adminPanel.confirmDisableModal).toBeVisible();
      await adminPanel.confirmDisableButton.click();

      // Verify user is disabled
      await expect(adminPanel.successMessage).toContainText(/user disabled/i);
      await expect(testUser).toContainText('Disabled');

      // Test that disabled user cannot login
      await authHelpers.clearStorage();
      await authHelpers.goToLogin();
      await adminPanel.page.fill('input[type="email"]', 'test-disable@example.com');
      await adminPanel.page.fill('input[type="password"]', 'testpassword');
      await adminPanel.page.click('button[type="submit"]');

      await expect(adminPanel.page.locator('text=/account disabled|access denied/i')).toBeVisible();

      // Re-enable user
      await authHelpers.quickLogin('admin');
      await adminPanel.usersTab.click();
      await testUser.locator(adminPanel.enableUserButton).click();
      await expect(adminPanel.successMessage).toContainText(/user enabled/i);
    });

    test('should bulk manage users @users', async () => {
      await adminPanel.usersTab.click();

      // Select multiple users
      const userCheckboxes = adminPanel.userRows.locator('input[type="checkbox"]');
      await userCheckboxes.nth(0).click();
      await userCheckboxes.nth(1).click();

      await expect(adminPanel.bulkActionsPanel).toBeVisible();
      await expect(adminPanel.selectedUsersCount).toContainText('2 users selected');

      // Test bulk export
      await adminPanel.bulkExportButton.click();
      await expect(adminPanel.exportProgressDialog).toBeVisible();
      await expect(adminPanel.exportCompleteMessage).toBeVisible({ timeout: 10000 });

      // Test bulk status change
      await adminPanel.bulkStatusButton.click();
      await adminPanel.bulkStatusSelect.selectOption('inactive');
      await adminPanel.applyBulkStatusButton.click();

      await expect(adminPanel.bulkUpdateCompleteMessage).toBeVisible();

      // Revert bulk changes
      await adminPanel.bulkStatusSelect.selectOption('active');
      await adminPanel.applyBulkStatusButton.click();
    });
  });

  test.describe('System Settings and Configuration', () => {
    test('should display and update system settings @settings', async () => {
      await adminPanel.settingsTab.click();
      await expect(adminPanel.settingsForm).toBeVisible();

      // Test different setting categories
      const settingCategories = ['general', 'email', 'security', 'integrations', 'notifications'];

      for (const category of settingCategories) {
        await adminPanel.settingsCategoryTab(category).click();
        await expect(adminPanel.settingsCategory(category)).toBeVisible();
        await assertions.checkPerformanceMetrics(1000);
      }
    });

    test('should update general system settings @settings', async () => {
      await adminPanel.settingsTab.click();
      await adminPanel.settingsCategoryTab('general').click();

      // Update settings
      const originalTitle = await adminPanel.systemTitleInput.inputValue();
      const newTitle = 'Shipnorth Test System';

      await adminPanel.systemTitleInput.fill(newTitle);
      await adminPanel.maintenanceModeToggle.click();
      await adminPanel.saveSettingsButton.click();

      // Verify settings saved
      await expect(adminPanel.successMessage).toContainText(/settings saved/i);

      // Verify settings are persisted
      await adminPanel.page.reload();
      await adminPanel.settingsTab.click();
      await adminPanel.settingsCategoryTab('general').click();

      await expect(adminPanel.systemTitleInput).toHaveValue(newTitle);
      await expect(adminPanel.maintenanceModeToggle).toBeChecked();

      // Revert changes
      await adminPanel.systemTitleInput.fill(originalTitle);
      await adminPanel.maintenanceModeToggle.click();
      await adminPanel.saveSettingsButton.click();
    });

    test('should configure email settings @settings', async () => {
      await adminPanel.settingsTab.click();
      await adminPanel.settingsCategoryTab('email').click();

      // Update email configuration
      await adminPanel.smtpServerInput.fill('smtp.test.com');
      await adminPanel.smtpPortInput.fill('587');
      await adminPanel.smtpUsernameInput.fill('test@shipnorth.com');
      await adminPanel.smtpPasswordInput.fill('testpassword');
      await adminPanel.emailFromInput.fill('noreply@shipnorth.com');

      // Test email configuration
      await adminPanel.testEmailButton.click();
      await adminPanel.testEmailAddressInput.fill('admin@shipnorth.com');
      await adminPanel.sendTestEmailButton.click();

      await expect(adminPanel.testEmailSentMessage).toBeVisible({ timeout: 10000 });

      await adminPanel.saveSettingsButton.click();
      await expect(adminPanel.successMessage).toContainText(/email settings saved/i);
    });

    test('should configure security settings @settings @security', async () => {
      await adminPanel.settingsTab.click();
      await adminPanel.settingsCategoryTab('security').click();

      // Update security settings
      await adminPanel.sessionTimeoutInput.fill('30');
      await adminPanel.passwordMinLengthInput.fill('10');
      await adminPanel.requireSpecialCharsToggle.click();
      await adminPanel.maxLoginAttemptsInput.fill('5');
      await adminPanel.lockoutDurationInput.fill('15');

      // Enable two-factor authentication
      await adminPanel.enable2FAToggle.click();
      await expect(adminPanel.qrCodeSetup).toBeVisible();

      await adminPanel.saveSettingsButton.click();
      await expect(adminPanel.successMessage).toContainText(/security settings saved/i);

      // Verify settings apply to new login attempts
      // This would be tested in integration with auth flows
    });

    test('should manage system integrations @settings', async () => {
      await adminPanel.settingsTab.click();
      await adminPanel.settingsCategoryTab('integrations').click();

      // Configure Stripe integration
      await adminPanel.stripePublishableKeyInput.fill('pk_test_123456789');
      await adminPanel.stripeSecretKeyInput.fill('sk_test_123456789');
      await adminPanel.stripeWebhookSecretInput.fill('whsec_123456789');

      // Test Stripe connection
      await adminPanel.testStripeConnectionButton.click();
      await expect(adminPanel.stripeConnectionStatus).toContainText(/connected|test mode/i);

      // Configure ShipStation integration
      await adminPanel.shipstationApiKeyInput.fill('test_api_key');
      await adminPanel.shipstationApiSecretInput.fill('test_api_secret');

      // Test ShipStation connection
      await adminPanel.testShipstationConnectionButton.click();
      await expect(adminPanel.shipstationConnectionStatus).toContainText(/connected/i);

      await adminPanel.saveSettingsButton.click();
      await expect(adminPanel.successMessage).toContainText(/integration settings saved/i);
    });
  });

  test.describe('Reports and Analytics', () => {
    test('should display system reports dashboard @reports', async () => {
      await adminPanel.reportsTab.click();
      await expect(adminPanel.reportsPanel).toBeVisible();

      // Verify report categories
      await expect(adminPanel.userReportsSection).toBeVisible();
      await expect(adminPanel.packageReportsSection).toBeVisible();
      await expect(adminPanel.performanceReportsSection).toBeVisible();
      await expect(adminPanel.financialReportsSection).toBeVisible();

      // Test date range selector
      await adminPanel.reportDateRangeSelect.selectOption('last_30_days');
      await expect(adminPanel.reportLoadingIndicator).toBeVisible();
      await expect(adminPanel.reportData).toBeVisible({ timeout: 10000 });
    });

    test('should generate user activity reports @reports', async () => {
      await adminPanel.reportsTab.click();
      await adminPanel.userReportsSection.click();

      // Generate user activity report
      await adminPanel.generateUserActivityReportButton.click();
      await adminPanel.reportDateRangeSelect.selectOption('last_7_days');
      await adminPanel.runReportButton.click();

      // Verify report data
      await expect(adminPanel.userActivityChart).toBeVisible({ timeout: 15000 });
      await expect(adminPanel.userActivityTable).toBeVisible();

      // Test report export
      await adminPanel.exportReportButton.click();
      await adminPanel.exportFormatSelect.selectOption('csv');
      await adminPanel.confirmExportButton.click();

      await expect(adminPanel.exportCompleteMessage).toBeVisible({ timeout: 10000 });
    });

    test('should generate performance analytics @reports @performance', async () => {
      await adminPanel.reportsTab.click();
      await adminPanel.performanceReportsSection.click();

      // Generate system performance report
      await adminPanel.generatePerformanceReportButton.click();

      await expect(adminPanel.performanceMetricsChart).toBeVisible({ timeout: 15000 });

      // Verify performance metrics are displayed
      await expect(adminPanel.averageResponseTime).toBeVisible();
      await expect(adminPanel.errorRate).toBeVisible();
      await expect(adminPanel.throughputMetric).toBeVisible();
      await expect(adminPanel.uptimePercentage).toBeVisible();

      // Check that metrics have reasonable values
      const uptimeText = await adminPanel.uptimePercentage.textContent();
      const uptime = parseFloat(uptimeText?.replace('%', '') || '0');
      expect(uptime).toBeGreaterThan(95); // Should have >95% uptime
    });

    test('should create custom reports @reports', async () => {
      await adminPanel.reportsTab.click();
      await adminPanel.createCustomReportButton.click();

      await expect(adminPanel.customReportBuilder).toBeVisible();

      // Build custom report
      await adminPanel.reportNameInput.fill('Custom User Package Report');
      await adminPanel.addDataSourceButton.click();
      await adminPanel.dataSourceSelect.selectOption('users');
      await adminPanel.addDataSourceButton.click();
      await adminPanel.dataSourceSelect.selectOption('packages');

      // Configure report filters
      await adminPanel.addFilterButton.click();
      await adminPanel.filterFieldSelect.selectOption('user.role');
      await adminPanel.filterOperatorSelect.selectOption('equals');
      await adminPanel.filterValueInput.fill('staff');

      // Configure report grouping
      await adminPanel.groupBySelect.selectOption('date');
      await adminPanel.aggregationSelect.selectOption('count');

      // Save and run report
      await adminPanel.saveReportButton.click();
      await adminPanel.runCustomReportButton.click();

      await expect(adminPanel.customReportResults).toBeVisible({ timeout: 15000 });
      await expect(adminPanel.customReportChart).toBeVisible();
    });

    test('should schedule automated reports @reports', async () => {
      await adminPanel.reportsTab.click();
      await adminPanel.scheduledReportsSection.click();

      // Create scheduled report
      await adminPanel.createScheduledReportButton.click();

      await adminPanel.scheduledReportNameInput.fill('Daily User Activity Report');
      await adminPanel.reportTemplateSelect.selectOption('user_activity');
      await adminPanel.scheduleFrequencySelect.selectOption('daily');
      await adminPanel.scheduleTimeInput.fill('09:00');
      await adminPanel.recipientEmailInput.fill('admin@shipnorth.com');

      await adminPanel.saveScheduledReportButton.click();

      // Verify scheduled report appears in list
      await expect(adminPanel.scheduledReportsList).toContainText('Daily User Activity Report');
      await expect(adminPanel.scheduledReportsList).toContainText('daily');
      await expect(adminPanel.scheduledReportsList).toContainText('09:00');

      // Test immediate execution
      const reportRow = adminPanel.scheduledReportsList.locator(
        'tr:has-text("Daily User Activity Report")'
      );
      await reportRow.locator(adminPanel.runNowButton).click();

      await expect(adminPanel.reportExecutionMessage).toContainText(/report queued for execution/i);
    });
  });

  test.describe('Security and Access Control', () => {
    test('should display security dashboard @security', async () => {
      await adminPanel.securityTab.click();
      await expect(adminPanel.securityDashboard).toBeVisible();

      // Verify security metrics
      await expect(adminPanel.activeSessionsCount).toBeVisible();
      await expect(adminPanel.recentLoginAttempts).toBeVisible();
      await expect(adminPanel.blockedIpsCount).toBeVisible();
      await expect(adminPanel.securityAlertsCount).toBeVisible();

      // Check recent security events
      await expect(adminPanel.securityEventsTable).toBeVisible();
      await expect(adminPanel.securityEventsTable).toContainText('Event Type');
      await expect(adminPanel.securityEventsTable).toContainText('User');
      await expect(adminPanel.securityEventsTable).toContainText('IP Address');
      await expect(adminPanel.securityEventsTable).toContainText('Timestamp');
    });

    test('should manage active sessions @security', async () => {
      await adminPanel.securityTab.click();
      await adminPanel.activeSessionsSection.click();

      await expect(adminPanel.activeSessionsTable).toBeVisible();

      // Test session termination
      const sessionRows = adminPanel.activeSessionsTable.locator('tbody tr');
      if ((await sessionRows.count()) > 1) {
        const firstSession = sessionRows.first();
        await firstSession.locator(adminPanel.terminateSessionButton).click();

        await expect(adminPanel.confirmTerminateModal).toBeVisible();
        await adminPanel.confirmTerminateButton.click();

        await expect(adminPanel.sessionTerminatedMessage).toBeVisible();
      }

      // Test bulk session management
      await adminPanel.terminateAllSessionsButton.click();
      await expect(adminPanel.confirmTerminateAllModal).toBeVisible();
      await adminPanel.cancelButton.click(); // Don't actually terminate all sessions
    });

    test('should manage IP blocking and rate limiting @security', async () => {
      await adminPanel.securityTab.click();
      await adminPanel.ipManagementSection.click();

      // Add IP to blocklist
      await adminPanel.addBlockedIpButton.click();
      await adminPanel.ipAddressInput.fill('192.168.1.100');
      await adminPanel.blockReasonInput.fill('Test security block');
      await adminPanel.confirmBlockIpButton.click();

      await expect(adminPanel.ipBlockedMessage).toBeVisible();
      await expect(adminPanel.blockedIpsList).toContainText('192.168.1.100');

      // Test IP whitelist
      await adminPanel.whitelistTab.click();
      await adminPanel.addWhitelistIpButton.click();
      await adminPanel.ipAddressInput.fill('10.0.0.1');
      await adminPanel.whitelistReasonInput.fill('Office network');
      await adminPanel.confirmWhitelistIpButton.click();

      await expect(adminPanel.ipWhitelistedMessage).toBeVisible();

      // Configure rate limiting
      await adminPanel.rateLimitingTab.click();
      await adminPanel.requestsPerMinuteInput.fill('100');
      await adminPanel.burstLimitInput.fill('200');
      await adminPanel.blockDurationInput.fill('60');

      await adminPanel.saveRateLimitButton.click();
      await expect(adminPanel.rateLimitSavedMessage).toBeVisible();
    });

    test('should handle security alerts and incidents @security', async () => {
      await adminPanel.securityTab.click();
      await adminPanel.securityAlertsSection.click();

      await expect(adminPanel.securityAlertsList).toBeVisible();

      // Process security alert
      if ((await adminPanel.securityAlertsList.locator('.alert-item').count()) > 0) {
        const firstAlert = adminPanel.securityAlertsList.locator('.alert-item').first();
        await firstAlert.click();

        await expect(adminPanel.alertDetailsPanel).toBeVisible();

        // Mark alert as resolved
        await adminPanel.resolveAlertButton.click();
        await adminPanel.resolutionNotesInput.fill('False positive - normal user behavior');
        await adminPanel.confirmResolveButton.click();

        await expect(adminPanel.alertResolvedMessage).toBeVisible();
      }

      // Create security incident
      await adminPanel.createIncidentButton.click();
      await adminPanel.incidentTitleInput.fill('Test Security Incident');
      await adminPanel.incidentDescriptionInput.fill('Testing incident creation workflow');
      await adminPanel.incidentSeveritySelect.selectOption('low');

      await adminPanel.createIncidentSubmitButton.click();
      await expect(adminPanel.incidentCreatedMessage).toBeVisible();
    });
  });

  test.describe('Audit Logs and Activity Tracking', () => {
    test('should display comprehensive audit logs @audit', async () => {
      await adminPanel.auditTab.click();
      await expect(adminPanel.auditLogTable).toBeVisible();

      // Verify audit log columns
      await expect(adminPanel.auditLogTable).toContainText('Timestamp');
      await expect(adminPanel.auditLogTable).toContainText('User');
      await expect(adminPanel.auditLogTable).toContainText('Action');
      await expect(adminPanel.auditLogTable).toContainText('Resource');
      await expect(adminPanel.auditLogTable).toContainText('IP Address');
      await expect(adminPanel.auditLogTable).toContainText('Details');

      // Test audit log filtering
      await adminPanel.auditFilterDateFrom.fill('2024-01-01');
      await adminPanel.auditFilterDateTo.fill('2024-12-31');
      await adminPanel.auditFilterUser.fill('admin@shipnorth.com');
      await adminPanel.auditFilterAction.selectOption('user_login');

      await adminPanel.applyAuditFilterButton.click();
      await expect(adminPanel.auditLogTable.locator('tbody tr')).toHaveCount.greaterThan(0);

      // Test audit log export
      await adminPanel.exportAuditLogButton.click();
      await adminPanel.exportFormatSelect.selectOption('json');
      await adminPanel.confirmExportButton.click();

      await expect(adminPanel.auditExportCompleteMessage).toBeVisible({ timeout: 10000 });
    });

    test('should track user activity in real-time @audit', async () => {
      await adminPanel.auditTab.click();
      await adminPanel.realTimeActivityTab.click();

      await expect(adminPanel.realTimeActivityFeed).toBeVisible();

      // Perform an action that should be logged
      await adminPanel.usersTab.click();
      await adminPanel.auditTab.click();
      await adminPanel.realTimeActivityTab.click();

      // Verify activity appears in real-time feed
      await expect(adminPanel.realTimeActivityFeed).toContainText('viewed users list');

      // Test activity filtering
      await adminPanel.activityFilterUser.selectOption('current_user');
      await adminPanel.activityFilterType.selectOption('navigation');

      await expect(
        adminPanel.filteredActivityFeed.locator('.activity-item')
      ).toHaveCount.greaterThan(0);
    });

    test('should provide detailed audit trail for critical actions @audit @security', async () => {
      // Perform a critical action (user creation) and verify audit trail
      await adminPanel.usersTab.click();
      await adminPanel.createUserButton.click();

      const auditUser = {
        name: 'Audit Test User',
        email: 'audit-test@example.com',
        role: 'staff',
        password: 'testpassword123',
      };

      await adminPanel.userNameInput.fill(auditUser.name);
      await adminPanel.userEmailInput.fill(auditUser.email);
      await adminPanel.userRoleSelect.selectOption(auditUser.role);
      await adminPanel.userPasswordInput.fill(auditUser.password);
      await adminPanel.userPasswordConfirmInput.fill(auditUser.password);

      await adminPanel.createUserSubmitButton.click();

      // Check audit log for user creation
      await adminPanel.auditTab.click();
      await adminPanel.auditSearchInput.fill('user_created');
      await adminPanel.searchAuditButton.click();

      const latestAuditEntry = adminPanel.auditLogTable.locator('tbody tr').first();
      await expect(latestAuditEntry).toContainText('user_created');
      await expect(latestAuditEntry).toContainText(auditUser.email);

      // View detailed audit information
      await latestAuditEntry.click();
      await expect(adminPanel.auditDetailPanel).toBeVisible();
      await expect(adminPanel.auditDetailPanel).toContainText(auditUser.name);
      await expect(adminPanel.auditDetailPanel).toContainText(auditUser.role);

      // Clean up test user
      await adminPanel.usersTab.click();
      const testUserRow = adminPanel.userRows.filter({ hasText: auditUser.email });
      await testUserRow.locator(adminPanel.deleteUserButton).click();
      await adminPanel.confirmDeleteButton.click();
    });
  });

  test.describe('Data Export and Backup', () => {
    test('should export system data @backup', async () => {
      await adminPanel.dataExportTab.click();
      await expect(adminPanel.dataExportPanel).toBeVisible();

      // Test selective data export
      await adminPanel.exportUsersCheckbox.click();
      await adminPanel.exportPackagesCheckbox.click();
      await adminPanel.exportSettingsCheckbox.click();

      await adminPanel.exportFormatSelect.selectOption('json');
      await adminPanel.includeMetadataCheckbox.click();

      await adminPanel.startExportButton.click();

      // Monitor export progress
      await expect(adminPanel.exportProgressBar).toBeVisible();
      await expect(adminPanel.exportCompleteMessage).toBeVisible({ timeout: 30000 });

      // Verify download link
      await expect(adminPanel.downloadExportButton).toBeVisible();
      await expect(adminPanel.exportSizeInfo).toBeVisible();
    });

    test('should create system backup @backup', async () => {
      await adminPanel.systemBackupTab.click();
      await expect(adminPanel.backupPanel).toBeVisible();

      // Create full system backup
      await adminPanel.createBackupButton.click();
      await adminPanel.backupNameInput.fill(`System Backup ${new Date().toISOString()}`);
      await adminPanel.backupDescriptionInput.fill('Automated test backup');
      await adminPanel.includeUploadsCheckbox.click();

      await adminPanel.startBackupButton.click();

      // Monitor backup progress
      await expect(adminPanel.backupProgressIndicator).toBeVisible();
      await expect(adminPanel.backupCompleteMessage).toBeVisible({ timeout: 60000 });

      // Verify backup appears in history
      await expect(adminPanel.backupHistoryTable).toContainText('System Backup');
      await expect(adminPanel.backupHistoryTable).toContainText('Completed');
    });

    test('should manage backup retention and cleanup @backup', async () => {
      await adminPanel.systemBackupTab.click();
      await adminPanel.backupSettingsSection.click();

      // Configure backup retention policy
      await adminPanel.retentionDaysInput.fill('30');
      await adminPanel.maxBackupsInput.fill('10');
      await adminPanel.autoCleanupToggle.click();

      await adminPanel.saveBackupSettingsButton.click();
      await expect(adminPanel.backupSettingsSavedMessage).toBeVisible();

      // Test manual cleanup
      await adminPanel.cleanupOldBackupsButton.click();
      await expect(adminPanel.confirmCleanupModal).toBeVisible();
      await adminPanel.confirmCleanupButton.click();

      await expect(adminPanel.cleanupCompleteMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should display system performance metrics @performance', async () => {
      await adminPanel.performanceTab.click();
      await expect(adminPanel.performanceMonitor).toBeVisible();

      // Verify performance metrics are displayed
      await expect(adminPanel.cpuUsageMetric).toBeVisible();
      await expect(adminPanel.memoryUsageMetric).toBeVisible();
      await expect(adminPanel.diskUsageMetric).toBeVisible();
      await expect(adminPanel.networkTrafficMetric).toBeVisible();
      await expect(adminPanel.databaseConnectionsMetric).toBeVisible();

      // Check that metrics have reasonable values
      const cpuUsage = await adminPanel.cpuUsageValue.textContent();
      const cpuPercent = parseFloat(cpuUsage?.replace('%', '') || '0');
      expect(cpuPercent).toBeLessThan(100);
      expect(cpuPercent).toBeGreaterThanOrEqual(0);

      // Test performance alerts
      await adminPanel.performanceAlertsSection.click();
      await expect(adminPanel.performanceAlertsList).toBeVisible();
    });

    test('should configure performance thresholds @performance', async () => {
      await adminPanel.performanceTab.click();
      await adminPanel.performanceSettingsSection.click();

      // Configure alert thresholds
      await adminPanel.cpuThresholdInput.fill('80');
      await adminPanel.memoryThresholdInput.fill('85');
      await adminPanel.diskThresholdInput.fill('90');
      await adminPanel.responseTimeThresholdInput.fill('2000');

      // Configure monitoring intervals
      await adminPanel.monitoringIntervalSelect.selectOption('30');
      await adminPanel.alertCooldownInput.fill('300');

      await adminPanel.savePerformanceSettingsButton.click();
      await expect(adminPanel.performanceSettingsSavedMessage).toBeVisible();

      // Test threshold validation
      await adminPanel.cpuThresholdInput.fill('150'); // Invalid value
      await adminPanel.savePerformanceSettingsButton.click();
      await expect(adminPanel.thresholdValidationError).toContainText(/invalid threshold/i);
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle admin panel errors gracefully @error-handling', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/admin/users', (route) => route.abort());

      await adminPanel.usersTab.click();
      await expect(adminPanel.errorMessage).toContainText(/failed to load users|network error/i);
      await expect(adminPanel.retryButton).toBeVisible();

      // Restore network and retry
      await page.unroute('**/api/admin/users');
      await adminPanel.retryButton.click();

      await expect(adminPanel.usersTable).toBeVisible();
    });

    test('should maintain admin session integrity @error-handling', async ({ page }) => {
      // Simulate session interruption
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
      });

      // Attempt admin action
      await adminPanel.usersTab.click();

      // Should redirect to login or show session expired message
      await expect(page).toHaveURL(/login|session-expired/);

      // Re-authenticate should restore admin access
      await authHelpers.quickLogin('admin');
      await expect(adminPanel.dashboardTitle).toBeVisible();
    });

    test('should handle concurrent admin operations @error-handling', async ({ page, context }) => {
      // Open second admin session
      const secondPage = await context.newPage();
      const secondAuthHelpers = new AuthHelpers(secondPage);
      const secondAdminPanel = new AdminPanel(secondPage);

      await secondAuthHelpers.quickLogin('admin');

      // Perform conflicting operations
      await adminPanel.usersTab.click();
      await secondAdminPanel.usersTab.click();

      const testUser = adminPanel.userRows.filter({ hasText: config.testUsers.staff.email });
      const secondTestUser = secondAdminPanel.userRows.filter({
        hasText: config.testUsers.staff.email,
      });

      // Edit same user from both sessions
      await testUser.locator(adminPanel.editUserButton).click();
      await secondTestUser.locator(secondAdminPanel.editUserButton).click();

      await adminPanel.userNameInput.fill('Modified by Session 1');
      await secondAdminPanel.userNameInput.fill('Modified by Session 2');

      // First save should succeed
      await adminPanel.saveUserButton.click();
      await expect(adminPanel.successMessage).toBeVisible();

      // Second save should detect conflict
      await secondAdminPanel.saveUserButton.click();
      await expect(secondAdminPanel.conflictWarning).toContainText(/record has been modified/i);

      await secondPage.close();
    });

    test('should recover from database connection issues @error-handling', async ({ page }) => {
      // Simulate database connection error
      await page.route('**/api/admin/**', (route) => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'Database connection failed' }),
        });
      });

      await adminPanel.usersTab.click();
      await expect(adminPanel.databaseErrorMessage).toContainText(/database.*unavailable/i);
      await expect(adminPanel.systemHealthCheck).toBeVisible();

      // Restore database connection
      await page.unroute('**/api/admin/**');
      await adminPanel.refreshButton.click();

      await expect(adminPanel.usersTable).toBeVisible();
      await expect(adminPanel.connectionRestoredMessage).toBeVisible();
    });
  });
});
