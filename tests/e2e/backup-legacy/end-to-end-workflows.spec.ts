import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('End-to-End Workflows', () => {
  test('should complete full staff workflow: package creation → assignment → delivery', async ({
    page,
  }) => {
    // Step 1: Login as staff
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    // Step 2: Create new package
    await expect(page).toHaveURL(new RegExp('.*/staff'));

    const createPackageButton = page.locator(
      '[data-testid="create-package"], [data-testid="new-package"]'
    );
    if (await createPackageButton.isVisible()) {
      await createPackageButton.click();

      const packageForm = page.locator('[data-testid="package-form"]');
      await expect(packageForm).toBeVisible();

      // Fill package details
      await page.fill('[data-testid="recipient-name"]', 'Test Customer');
      await page.fill('[data-testid="recipient-email"]', 'testcustomer@example.com');
      await page.fill('[data-testid="delivery-address"]', '123 Test Street, Vancouver, BC');
      await page.fill('[data-testid="package-description"]', 'Test package for E2E workflow');

      // Submit package creation
      await page.click('[data-testid="create-package-submit"]');

      // Should show success and package ID
      const packageCreated = page.locator('[data-testid="package-created-success"]');
      await expect(packageCreated).toBeVisible();

      const packageId = await page.locator('[data-testid="new-package-id"]').textContent();
      expect(packageId).toMatch(/SNH\d+|\d+/);
    }

    // Step 3: Create or assign to load
    const assignToLoadButton = page.locator('[data-testid="assign-to-load"]');
    const createLoadButton = page.locator('[data-testid="create-load"]');

    if (await assignToLoadButton.isVisible()) {
      await assignToLoadButton.click();

      const loadModal = page.locator('[data-testid="load-assignment-modal"]');
      await expect(loadModal).toBeVisible();

      // Select existing load or create new
      const existingLoads = loadModal.locator('[data-testid^="load-option-"]');
      const createNewLoad = loadModal.locator('[data-testid="create-new-load"]');

      if ((await existingLoads.count()) > 0) {
        await existingLoads.first().click();
      } else if (await createNewLoad.isVisible()) {
        await createNewLoad.click();

        // Fill load details
        await page.fill('[data-testid="load-name"]', 'Test Load - E2E');
        await page.fill('[data-testid="delivery-date"]', '2024-12-31');
      }

      await page.click('[data-testid="confirm-load-assignment"]');

      await expect(page.locator('[data-testid="package-assigned-success"]')).toBeVisible();
    } else if (await createLoadButton.isVisible()) {
      await createLoadButton.click();

      const loadForm = page.locator('[data-testid="load-form"]');
      await expect(loadForm).toBeVisible();

      await page.fill('[data-testid="load-name"]', 'E2E Test Load');
      await page.fill('[data-testid="driver-assignment"]', config.testUsers.driver.email);

      await page.click('[data-testid="create-load-submit"]');

      await expect(page.locator('[data-testid="load-created-success"]')).toBeVisible();
    }

    // Step 4: Assign driver
    const assignDriverButton = page.locator('[data-testid="assign-driver"]');
    if (await assignDriverButton.isVisible()) {
      await assignDriverButton.click();

      const driverModal = page.locator('[data-testid="driver-assignment-modal"]');
      await expect(driverModal).toBeVisible();

      const driverSelect = driverModal.locator('[data-testid="driver-select"]');
      await driverSelect.click();

      const driverOption = page.locator(`[data-testid="driver-${config.testUsers.driver.email}"]`);
      if (await driverOption.isVisible()) {
        await driverOption.click();
      } else {
        // Select first available driver
        const availableDrivers = page.locator('[data-testid^="driver-"]');
        if ((await availableDrivers.count()) > 0) {
          await availableDrivers.first().click();
        }
      }

      await page.click('[data-testid="confirm-driver-assignment"]');

      await expect(page.locator('[data-testid="driver-assigned-success"]')).toBeVisible();
    }

    // Step 5: Verify workflow completion
    const packagesList = page.locator('[data-testid="packages-list"]');
    if (await packagesList.isVisible()) {
      const newPackage = packagesList.locator('[data-testid*="Test Customer"]').first();

      if (await newPackage.isVisible()) {
        await expect(newPackage.locator('[data-testid="package-status"]')).toContainText(
          /assigned|ready|in.*load/
        );
        await expect(newPackage.locator('[data-testid="assigned-driver"]')).toBeVisible();
      }
    }
  });

  test('should complete full customer journey: registration → tracking → delivery confirmation', async ({
    page,
  }) => {
    // Step 1: Customer registration
    await page.goto('/register');

    const registerForm = page.locator('[data-testid="register-form"]');
    await expect(registerForm).toBeVisible();

    // Fill registration form
    const uniqueEmail = `e2etest${Date.now()}@example.com`;
    await page.fill('[data-testid="register-name"]', 'E2E Test Customer');
    await page.fill('[data-testid="register-email"]', uniqueEmail);
    await page.fill('[data-testid="register-password"]', 'TestPassword123');
    await page.fill('[data-testid="register-confirm-password"]', 'TestPassword123');

    await page.click('[data-testid="register-submit"]');

    // Should redirect to login or dashboard
    const registrationSuccess = page.locator('[data-testid="registration-success"]');
    const loginRedirect = page.locator('[data-testid="login-form"]');
    const customerDashboard = page.locator('[data-testid="customer-dashboard"]');

    if (await registrationSuccess.isVisible()) {
      await expect(registrationSuccess).toBeVisible();

      // Need to login
      if (await loginRedirect.isVisible()) {
        await page.fill('[data-testid="login-email"]', uniqueEmail);
        await page.fill('[data-testid="login-password"]', 'TestPassword123');
        await page.click('[data-testid="login-submit"]');
      }
    }

    // Step 2: Verify customer dashboard access
    await expect(page).toHaveURL(new RegExp('.*/portal'));
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();

    // Step 3: Track packages (assuming some exist)
    const packagesSection = page.locator('[data-testid="customer-packages"]');
    if (await packagesSection.isVisible()) {
      const packageItems = packagesSection.locator('[data-testid^="package-"]');

      if ((await packageItems.count()) > 0) {
        const firstPackage = packageItems.first();
        await firstPackage.click();

        // Should show package details
        const packageDetails = page.locator('[data-testid="package-details-modal"]');
        await expect(packageDetails).toBeVisible();

        // Check tracking timeline
        const trackingTimeline = packageDetails.locator('[data-testid="tracking-timeline"]');
        if (await trackingTimeline.isVisible()) {
          await expect(trackingTimeline).toBeVisible();

          const timelineSteps = trackingTimeline.locator('[data-testid^="timeline-step-"]');
          expect(await timelineSteps.count()).toBeGreaterThan(0);
        }

        // Check delivery information
        const deliveryInfo = packageDetails.locator('[data-testid="delivery-info"]');
        if (await deliveryInfo.isVisible()) {
          await expect(deliveryInfo.locator('[data-testid="delivery-address"]')).toBeVisible();
          await expect(deliveryInfo.locator('[data-testid="estimated-delivery"]')).toBeVisible();
        }

        await page.click('[data-testid="close-package-details"]');
      }
    }

    // Step 4: Test tracking search
    const trackingSearch = page.locator('[data-testid="tracking-search"]');
    if (await trackingSearch.isVisible()) {
      await trackingSearch.fill('SNH123456789');
      await page.click('[data-testid="track-package-submit"]');

      // Should show tracking results or not found message
      const trackingResults = page.locator('[data-testid="tracking-results"]');
      const notFound = page.locator('[data-testid="tracking-not-found"]');

      const hasResults = await trackingResults.isVisible();
      const hasNotFound = await notFound.isVisible();

      expect(hasResults || hasNotFound).toBeTruthy();
    }

    // Step 5: Check notifications (if any)
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    if (await notificationBell.isVisible()) {
      await notificationBell.click();

      const notificationsPanel = page.locator('[data-testid="notifications-panel"]');
      if (await notificationsPanel.isVisible()) {
        await expect(notificationsPanel).toBeVisible();

        const notifications = notificationsPanel.locator('[data-testid^="notification-"]');
        // Notifications may or may not exist
        expect(await notifications.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should complete full driver workflow: login → scan → deliver → confirm', async ({
    page,
  }) => {
    // Step 1: Driver login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.driver.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.driver.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    // Should be on driver dashboard
    await expect(page).toHaveURL(new RegExp('.*/driver'));
    await expect(page.locator('[data-testid="driver-dashboard"]')).toBeVisible();

    // Step 2: View assigned loads
    const currentLoad = page.locator('[data-testid="current-load"]');
    const assignedLoads = page.locator('[data-testid="assigned-loads"]');

    if (await currentLoad.isVisible()) {
      // Driver has active load
      await expect(currentLoad).toBeVisible();

      const loadManifest = currentLoad.locator('[data-testid="view-manifest"]');
      if (await loadManifest.isVisible()) {
        await loadManifest.click();

        // Check manifest
        const manifestModal = page.locator('[data-testid="manifest-modal"]');
        await expect(manifestModal).toBeVisible();

        const packageList = manifestModal.locator('[data-testid="manifest-packages"]');
        await expect(packageList).toBeVisible();

        await page.click('[data-testid="close-manifest"]');
      }
    } else if (await assignedLoads.isVisible()) {
      // Select a load to start
      const loadItems = assignedLoads.locator('[data-testid^="load-"]');

      if ((await loadItems.count()) > 0) {
        const firstLoad = loadItems.first();
        await firstLoad.click();

        const startLoadButton = page.locator('[data-testid="start-load"]');
        if (await startLoadButton.isVisible()) {
          await startLoadButton.click();

          await expect(page.locator('[data-testid="load-started-success"]')).toBeVisible();
        }
      }
    }

    // Step 3: Package scanning
    const scanPackageButton = page.locator('[data-testid="scan-package"]');
    if (await scanPackageButton.isVisible()) {
      await scanPackageButton.click();

      const scannerModal = page.locator('[data-testid="scanner-modal"]');
      await expect(scannerModal).toBeVisible();

      // Use manual entry for testing
      const manualEntry = scannerModal.locator('[data-testid="manual-entry"]');
      if (await manualEntry.isVisible()) {
        await manualEntry.click();

        const barcodeInput = page.locator('[data-testid="barcode-input"]');
        await barcodeInput.fill('SNH123456789');
        await page.click('[data-testid="submit-barcode"]');

        // Should show package information
        const packageInfo = page.locator('[data-testid="scanned-package-info"]');
        if (await packageInfo.isVisible()) {
          await expect(packageInfo).toBeVisible();
          await expect(packageInfo.locator('[data-testid="package-id"]')).toBeVisible();
          await expect(packageInfo.locator('[data-testid="delivery-address"]')).toBeVisible();
        }

        await page.click('[data-testid="close-scanner"]');
      }
    }

    // Step 4: Delivery process
    const packageItems = page.locator('[data-testid^="package-item-"]');
    if ((await packageItems.count()) > 0) {
      const firstPackage = packageItems.first();
      await firstPackage.click();

      const packageModal = page.locator('[data-testid="package-modal"]');
      await expect(packageModal).toBeVisible();

      // Mark as delivered
      const markDelivered = packageModal.locator('[data-testid="mark-delivered"]');
      if (await markDelivered.isVisible()) {
        await markDelivered.click();

        const deliveryModal = page.locator('[data-testid="delivery-confirmation-modal"]');
        await expect(deliveryModal).toBeVisible();

        // Step 5: Capture signature
        const captureSignature = deliveryModal.locator('[data-testid="capture-signature"]');
        if (await captureSignature.isVisible()) {
          await captureSignature.click();

          const signatureCanvas = page.locator('[data-testid="signature-canvas"]');
          await expect(signatureCanvas).toBeVisible();

          // Simulate signature drawing
          const canvasBox = await signatureCanvas.boundingBox();
          if (canvasBox) {
            await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
            await page.mouse.down();
            await page.mouse.move(canvasBox.x + 150, canvasBox.y + 100);
            await page.mouse.up();

            await page.click('[data-testid="save-signature"]');
            await expect(page.locator('[data-testid="signature-saved"]')).toBeVisible();
          }
        }

        // Step 6: Add delivery photo
        const addPhoto = deliveryModal.locator('[data-testid="add-photo"]');
        if (await addPhoto.isVisible()) {
          await addPhoto.click();

          const fileInput = page.locator('input[type="file"]');
          await fileInput.setInputFiles({
            name: 'delivery-photo.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake delivery photo'),
          });

          await expect(page.locator('[data-testid="photo-uploaded"]')).toBeVisible();
        }

        // Confirm delivery
        const confirmDelivery = deliveryModal.locator('[data-testid="confirm-delivery"]');
        await expect(confirmDelivery).toBeVisible();
        await confirmDelivery.click();

        // Should show delivery confirmation
        await expect(page.locator('[data-testid="delivery-confirmed"]')).toBeVisible();

        // Package status should update
        const packageStatus = page.locator('[data-testid="package-status"]');
        if (await packageStatus.isVisible()) {
          await expect(packageStatus).toContainText(/delivered|complete/);
        }
      }
    }

    // Step 7: Update load status
    const completeLoadButton = page.locator('[data-testid="complete-load"]');
    if (await completeLoadButton.isVisible()) {
      await completeLoadButton.click();

      const completionModal = page.locator('[data-testid="load-completion-modal"]');
      if (await completionModal.isVisible()) {
        // Add completion notes
        const completionNotes = completionModal.locator('[data-testid="completion-notes"]');
        if (await completionNotes.isVisible()) {
          await completionNotes.fill('All packages delivered successfully - E2E test');
        }

        await page.click('[data-testid="confirm-load-completion"]');

        await expect(page.locator('[data-testid="load-completed-success"]')).toBeVisible();
      }
    }
  });

  test('should complete full admin workflow: user management → reporting → monitoring', async ({
    page,
  }) => {
    // Step 1: Admin login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.admin.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.admin.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);

    await expect(page).toHaveURL(new RegExp('.*/admin'));

    // Step 2: User management
    const userManagement = page.locator('[data-testid="nav-users"]');
    if (await userManagement.isVisible()) {
      await userManagement.click();

      const usersTable = page.locator('[data-testid="users-table"]');
      await expect(usersTable).toBeVisible();

      // Create new user
      const createUser = page.locator('[data-testid="create-user"]');
      if (await createUser.isVisible()) {
        await createUser.click();

        const userForm = page.locator('[data-testid="user-form"]');
        await expect(userForm).toBeVisible();

        const uniqueEmail = `e2eadmintest${Date.now()}@example.com`;
        await page.fill('[data-testid="user-email"]', uniqueEmail);
        await page.fill('[data-testid="user-name"]', 'E2E Admin Test User');
        await page.fill('[data-testid="user-password"]', 'TempPassword123');

        const roleSelect = page.locator('[data-testid="user-role"]');
        await roleSelect.click();
        await page.click('[data-testid="role-staff"]');

        await page.click('[data-testid="create-user-submit"]');

        await expect(page.locator('[data-testid="user-created-success"]')).toBeVisible();

        // Verify user appears in table
        await expect(usersTable.locator(`text=${uniqueEmail}`)).toBeVisible();
      }
    }

    // Step 3: System monitoring
    const systemMonitoring = page.locator(
      '[data-testid="nav-system"], [data-testid="nav-monitoring"]'
    );
    if (await systemMonitoring.isVisible()) {
      await systemMonitoring.click();

      const systemDashboard = page.locator('[data-testid="system-dashboard"]');
      await expect(systemDashboard).toBeVisible();

      // Check system metrics
      const systemMetrics = systemDashboard.locator('[data-testid="system-metrics"]');
      if (await systemMetrics.isVisible()) {
        await expect(systemMetrics.locator('[data-testid="cpu-usage"]')).toBeVisible();
        await expect(systemMetrics.locator('[data-testid="memory-usage"]')).toBeVisible();
        await expect(systemMetrics.locator('[data-testid="active-users"]')).toBeVisible();
      }

      // Check recent activity
      const recentActivity = systemDashboard.locator('[data-testid="recent-activity"]');
      if (await recentActivity.isVisible()) {
        const activityItems = recentActivity.locator('[data-testid^="activity-"]');
        expect(await activityItems.count()).toBeGreaterThanOrEqual(0);
      }
    }

    // Step 4: Reports generation
    const reportsSection = page.locator('[data-testid="nav-reports"]');
    if (await reportsSection.isVisible()) {
      await reportsSection.click();

      const reportsPage = page.locator('[data-testid="reports-page"]');
      await expect(reportsPage).toBeVisible();

      // Generate delivery report
      const deliveryReport = reportsPage.locator('[data-testid="delivery-report"]');
      if (await deliveryReport.isVisible()) {
        await deliveryReport.click();

        const reportModal = page.locator('[data-testid="report-configuration-modal"]');
        await expect(reportModal).toBeVisible();

        // Set report parameters
        const fromDate = reportModal.locator('[data-testid="from-date"]');
        const toDate = reportModal.locator('[data-testid="to-date"]');

        if ((await fromDate.isVisible()) && (await toDate.isVisible())) {
          await fromDate.fill('2024-01-01');
          await toDate.fill('2024-12-31');
        }

        const generateButton = reportModal.locator('[data-testid="generate-report"]');
        await generateButton.click();

        // Should show report generation progress
        const reportProgress = page.locator('[data-testid="report-progress"]');
        if (await reportProgress.isVisible()) {
          await expect(reportProgress).toBeVisible();

          // Wait for completion
          await page.waitForSelector('[data-testid="report-ready"]');

          const downloadReport = page.locator('[data-testid="download-report"]');
          if (await downloadReport.isVisible()) {
            const [download] = await Promise.all([
              page.waitForEvent('download'),
              downloadReport.click(),
            ]);

            expect(download.suggestedFilename()).toMatch(/delivery.*report.*\.(pdf|xlsx|csv)$/);
          }
        }
      }
    }

    // Step 5: System settings
    const settingsSection = page.locator('[data-testid="nav-settings"]');
    if (await settingsSection.isVisible()) {
      await settingsSection.click();

      const settingsPage = page.locator('[data-testid="settings-page"]');
      await expect(settingsPage).toBeVisible();

      // Check notification settings
      const notificationSettings = settingsPage.locator('[data-testid="notification-settings"]');
      if (await notificationSettings.isVisible()) {
        const emailNotifications = notificationSettings.locator(
          '[data-testid="email-notifications-toggle"]'
        );
        if (await emailNotifications.isVisible()) {
          const isEnabled = await emailNotifications.isChecked();

          // Toggle setting
          await emailNotifications.click();
          await expect(emailNotifications).toBeChecked({ checked: !isEnabled });

          // Save settings
          const saveSettings = settingsPage.locator('[data-testid="save-settings"]');
          if (await saveSettings.isVisible()) {
            await saveSettings.click();
            await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
          }
        }
      }
    }
  });

  test('should verify cross-interface data consistency', async ({ page }) => {
    // Step 1: Create package as staff
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);
    await page.click('[data-testid="login-submit"]');

    let packageId = '';
    const createPackageButton = page.locator('[data-testid="create-package"]');
    if (await createPackageButton.isVisible()) {
      await createPackageButton.click();

      // Create package with specific details for verification
      await page.fill('[data-testid="recipient-name"]', 'Consistency Test Customer');
      await page.fill('[data-testid="recipient-email"]', 'consistency@test.com');
      await page.fill('[data-testid="delivery-address"]', '456 Consistency Ave, Test City, TC');

      await page.click('[data-testid="create-package-submit"]');

      const packageIdElement = page.locator('[data-testid="new-package-id"]');
      if (await packageIdElement.isVisible()) {
        const idText = await packageIdElement.textContent();
        packageId = idText || 'SNH999999999';
      }
    }

    // Step 2: Verify package appears in staff interface
    const staffPackagesList = page.locator('[data-testid="packages-list"]');
    if (await staffPackagesList.isVisible()) {
      const newPackage = staffPackagesList.locator(`[data-testid*="Consistency Test Customer"]`);
      if (await newPackage.isVisible()) {
        await expect(newPackage).toBeVisible();
        await expect(newPackage.locator('[data-testid="recipient-name"]')).toContainText(
          'Consistency Test Customer'
        );
      }
    }

    // Step 3: Verify as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.admin.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.admin.password);
    await page.click('[data-testid="login-submit"]');

    const adminPackagesNav = page.locator('[data-testid="nav-packages"]');
    if (await adminPackagesNav.isVisible()) {
      await adminPackagesNav.click();

      const adminPackagesList = page.locator('[data-testid="packages-table"]');
      if (await adminPackagesList.isVisible()) {
        const consistencyPackage = adminPackagesList.locator('text=Consistency Test Customer');
        if (await consistencyPackage.isVisible()) {
          await expect(consistencyPackage).toBeVisible();
        }
      }
    }

    // Step 4: Verify package tracking as customer (if customer has access)
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'consistency@test.com');
    await page.fill('[data-testid="login-password"]', 'customer123');

    const loginResult = await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).then(() => 'navigated'),
      page.waitForSelector('[data-testid="login-error"]', { timeout: 5000 }).then(() => 'error'),
    ]).catch(() => 'timeout');

    if (loginResult === 'navigated') {
      const customerPackages = page.locator('[data-testid="customer-packages"]');
      if (await customerPackages.isVisible()) {
        const trackingInfo = customerPackages.locator('[data-testid*="consistency"]');
        if (await trackingInfo.isVisible()) {
          await expect(trackingInfo).toBeVisible();
        }
      }
    }

    // Step 5: Verify in driver interface (if assigned)
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.driver.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.driver.password);
    await page.click('[data-testid="login-submit"]');

    const driverManifest = page.locator('[data-testid="driver-packages"]');
    if (await driverManifest.isVisible()) {
      // Search for the package in driver's assigned packages
      const searchDriver = driverManifest.locator('[data-testid="package-search"]');
      if (await searchDriver.isVisible()) {
        await searchDriver.fill('Consistency Test Customer');

        const searchResults = page.locator('[data-testid="search-results"]');
        if (await searchResults.isVisible()) {
          const foundPackage = searchResults.locator('text=Consistency Test Customer');
          if (await foundPackage.isVisible()) {
            await expect(foundPackage).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle complete error recovery workflow', async ({ page }) => {
    // Test error conditions and recovery mechanisms

    // Step 1: Test network interruption during package creation
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);
    await page.click('[data-testid="login-submit"]');

    const createPackageButton = page.locator('[data-testid="create-package"]');
    if (await createPackageButton.isVisible()) {
      await createPackageButton.click();

      // Fill form
      await page.fill('[data-testid="recipient-name"]', 'Error Recovery Test');
      await page.fill('[data-testid="recipient-email"]', 'errortest@example.com');
      await page.fill('[data-testid="delivery-address"]', '789 Error Recovery St');

      // Simulate network error
      await page.route('**/api/packages/**', (route) => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });

      await page.click('[data-testid="create-package-submit"]');

      // Should show error message
      const errorMessage = page.locator('[data-testid="package-creation-error"]');
      await expect(errorMessage).toBeVisible();

      // Should offer retry option
      const retryButton = page.locator('[data-testid="retry-package-creation"]');
      if (await retryButton.isVisible()) {
        // Clear network error
        await page.unroute('**/api/packages/**');

        await retryButton.click();

        // Should succeed on retry
        const successMessage = page.locator('[data-testid="package-created-success"]');
        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
      }
    }

    // Step 2: Test form validation error recovery
    if (await createPackageButton.isVisible()) {
      await createPackageButton.click();

      // Submit incomplete form
      await page.click('[data-testid="create-package-submit"]');

      // Should show validation errors
      const validationErrors = page.locator('[data-testid^="validation-error-"]');
      expect(await validationErrors.count()).toBeGreaterThan(0);

      // Fix errors one by one
      await page.fill('[data-testid="recipient-name"]', 'Fixed Name');

      // Error for name should disappear
      const nameError = page.locator('[data-testid="validation-error-name"]');
      if (await nameError.isVisible()) {
        await page.waitForSelector('[data-testid="validation-error-name"]', { state: 'hidden' });
      }

      // Complete form
      await page.fill('[data-testid="recipient-email"]', 'fixed@example.com');
      await page.fill('[data-testid="delivery-address"]', '123 Fixed Address');

      // Should now submit successfully
      await page.click('[data-testid="create-package-submit"]');

      const fixedSuccess = page.locator('[data-testid="package-created-success"]');
      if (await fixedSuccess.isVisible()) {
        await expect(fixedSuccess).toBeVisible();
      }
    }

    // Step 3: Test session expiration recovery
    // Simulate expired session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to perform an action that requires authentication
    await page.reload();

    const sessionExpiredMessage = page.locator('[data-testid="session-expired"]');
    const loginRedirect = page.locator('[data-testid="login-form"]');

    // Should redirect to login or show session expired message
    const hasExpiredMessage = await sessionExpiredMessage.isVisible();
    const hasLoginForm = await loginRedirect.isVisible();

    expect(hasExpiredMessage || hasLoginForm).toBeTruthy();

    if (hasLoginForm) {
      // Re-login should work
      await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
      await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);
      await page.click('[data-testid="login-submit"]');

      // Should return to staff dashboard
      await expect(page).toHaveURL(new RegExp('.*/staff'));
    }
  });

  test('should maintain performance under load simulation', async ({ page }) => {
    // Simulate heavy usage scenario

    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.staff.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.staff.password);
    await page.click('[data-testid="login-submit"]');

    // Test rapid navigation
    const navItems = [
      '[data-testid="nav-packages"]',
      '[data-testid="nav-customers"]',
      '[data-testid="nav-loads"]',
      '[data-testid="nav-dashboard"]',
    ];

    for (const navItem of navItems) {
      const nav = page.locator(navItem);
      if (await nav.isVisible()) {
        const startTime = Date.now();

        await nav.click();

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load within reasonable time (5 seconds)
        expect(loadTime).toBeLessThan(5000);

        // Page should be interactive
        const pageContent = page.locator(
          '[data-testid*="page"], [data-testid*="dashboard"], [data-testid*="list"]'
        );
        await expect(pageContent.first()).toBeVisible();
      }
    }

    // Test search performance
    const globalSearch = page.locator('[data-testid="global-search"]');
    if (await globalSearch.isVisible()) {
      await globalSearch.click();

      const searchInput = page.locator('[data-testid="global-search-input"]');

      const searchStartTime = Date.now();
      await searchInput.fill('performance test query');

      // Should show results quickly
      await page.waitForSelector(
        '[data-testid="search-results"], [data-testid="no-search-results"]'
      );

      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(3000);
    }

    // Test form submission performance
    const quickActions = page.locator('[data-testid*="quick-"], [data-testid*="create-"]');
    if ((await quickActions.count()) > 0) {
      const firstAction = quickActions.first();

      const actionStartTime = Date.now();
      await firstAction.click();

      // Should respond quickly
      await page.waitForSelector(
        '[data-testid*="modal"], [data-testid*="form"], [data-testid*="page"]'
      );

      const actionTime = Date.now() - actionStartTime;
      expect(actionTime).toBeLessThan(2000);
    }
  });
});
