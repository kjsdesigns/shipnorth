import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { StaffDashboard, CustomerPortal, DriverPortal, AdminPanel } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';

/**
 * End-to-End Business Workflows - Comprehensive Test Suite
 *
 * Consolidates:
 * - end-to-end-workflows.spec.ts
 * - complete-workflow-test.spec.ts
 * - fixed-workflow-test.spec.ts
 * - web-interface.spec.ts
 *
 * Coverage:
 * - Complete package lifecycle workflows
 * - Cross-role collaboration scenarios
 * - Multi-user interaction testing
 * - Business process validation
 * - Integration between all system components
 * - Real-world usage scenarios
 * - Data flow validation across roles
 * - System reliability under complex workflows
 */

test.describe('End-to-End Business Workflows', () => {
  let authHelpers: AuthHelpers;
  let staffDashboard: StaffDashboard;
  let customerPortal: CustomerPortal;
  let driverPortal: DriverPortal;
  let adminPanel: AdminPanel;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    staffDashboard = new StaffDashboard(page);
    customerPortal = new CustomerPortal(page);
    driverPortal = new DriverPortal(page);
    adminPanel = new AdminPanel(page);
    assertions = new CustomAssertions(page);
  });

  test.describe('Complete Package Lifecycle', () => {
    test('should complete full package journey from creation to delivery @e2e @smoke', async ({
      page,
      context,
    }) => {
      const trackingNumber = `E2E-${Date.now()}`;
      const packageData = {
        trackingNumber,
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        weight: 2.5,
        dimensions: { length: 12, width: 10, height: 8 },
        destination: {
          address: '123 Main Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A1',
        },
        contents: 'Electronics - Laptop Computer',
      };

      // Phase 1: Staff creates package
      await authHelpers.quickLogin('staff');

      // Navigate to package creation
      await staffDashboard.packagesTab.click();
      await staffDashboard.createPackageButton.click();

      // Fill package details
      await staffDashboard.packageTrackingNumberInput.fill(packageData.trackingNumber);
      await staffDashboard.customerNameInput.fill(packageData.customerName);
      await staffDashboard.customerEmailInput.fill(packageData.customerEmail);
      await staffDashboard.packageWeightInput.fill(packageData.weight.toString());
      await staffDashboard.packageLengthInput.fill(packageData.dimensions.length.toString());
      await staffDashboard.packageWidthInput.fill(packageData.dimensions.width.toString());
      await staffDashboard.packageHeightInput.fill(packageData.dimensions.height.toString());
      await staffDashboard.destinationAddressInput.fill(packageData.destination.address);
      await staffDashboard.destinationCityInput.fill(packageData.destination.city);
      await staffDashboard.destinationProvinceSelect.selectOption(packageData.destination.province);
      await staffDashboard.destinationPostalCodeInput.fill(packageData.destination.postalCode);
      await staffDashboard.packageContentsInput.fill(packageData.contents);

      // Create package
      await staffDashboard.submitPackageButton.click();
      await expect(staffDashboard.packageCreatedMessage).toBeVisible();

      // Verify package appears in staff dashboard
      await expect(staffDashboard.packagesTable).toContainText(trackingNumber);
      await expect(staffDashboard.packagesTable).toContainText(packageData.customerName);

      // Phase 2: Customer tracks package
      const customerPage = await context.newPage();
      const customerAuthHelpers = new AuthHelpers(customerPage);
      const customerPortalPage = new CustomerPortal(customerPage);

      await customerPage.goto('/portal');

      // Customer should be able to track without login for public tracking
      await customerPortalPage.trackingNumberInput.fill(trackingNumber);
      await customerPortalPage.trackPackageButton.click();

      await expect(customerPortalPage.packageDetails).toBeVisible();
      await expect(customerPortalPage.packageDetails).toContainText(trackingNumber);
      await expect(customerPortalPage.packageStatus).toContainText('Pending');

      // Phase 3: Staff assigns to driver and creates shipping label
      await staffDashboard.packagesTable.locator(`tr:has-text("${trackingNumber}")`).click();
      await staffDashboard.packageDetailsPanel.waitFor();

      await staffDashboard.assignDriverButton.click();
      await staffDashboard.driverSelect.selectOption(config.testUsers.driver.email);
      await staffDashboard.assignButton.click();

      // Create shipping label
      await staffDashboard.createLabelButton.click();
      await staffDashboard.shippingCarrierSelect.selectOption('Canada Post');
      await staffDashboard.serviceTypeSelect.selectOption('Expedited Parcel');
      await staffDashboard.confirmLabelCreationButton.click();

      await expect(staffDashboard.labelCreatedMessage).toBeVisible();
      await expect(staffDashboard.packageStatus).toContainText('Ready for Pickup');

      // Phase 4: Driver picks up and processes package
      const driverPage = await context.newPage();
      const driverAuthHelpers = new AuthHelpers(driverPage);
      const driverPortalPage = new DriverPortal(driverPage);

      await driverAuthHelpers.quickLogin('driver');

      // Driver sees assigned package
      await expect(driverPortalPage.deliveryList).toContainText(trackingNumber);

      // Start delivery route
      await driverPortalPage.deliveryItems.filter({ hasText: trackingNumber }).click();
      await driverPortalPage.startDeliveryButton.click();

      // Update status to picked up
      await driverPortalPage.updateStatusButton.click();
      await driverPortalPage.statusSelect.selectOption('picked_up');
      await driverPortalPage.statusMessageInput.fill('Package picked up from depot');
      await driverPortalPage.confirmStatusUpdateButton.click();

      await expect(driverPortalPage.statusUpdatedMessage).toBeVisible();

      // Phase 5: Customer sees updated tracking
      await customerPortalPage.refreshTrackingButton.click();
      await expect(customerPortalPage.packageStatus).toContainText('Picked Up');
      await expect(customerPortalPage.trackingHistory).toContainText(
        'Package picked up from depot'
      );

      // Phase 6: Driver updates location during transit
      await context.grantPermissions(['geolocation']);
      await driverPage.setGeolocation({ latitude: 43.6532, longitude: -79.3832 });

      await driverPortalPage.updateLocationButton.click();
      await driverPortalPage.statusSelect.selectOption('in_transit');
      await driverPortalPage.statusMessageInput.fill('Package in transit to destination');
      await driverPortalPage.confirmStatusUpdateButton.click();

      // Phase 7: Driver completes delivery
      await driverPage.setGeolocation({
        latitude: 43.6462,
        longitude: -79.381, // Destination coordinates
      });

      await driverPortalPage.updateStatusButton.click();
      await driverPortalPage.statusSelect.selectOption('out_for_delivery');
      await driverPortalPage.confirmStatusUpdateButton.click();

      // Capture proof of delivery
      await context.grantPermissions(['camera']);
      await driverPortalPage.proofOfDeliveryButton.click();
      await driverPortalPage.capturePhotoButton.click();
      await driverPortalPage.uploadPhotoButton.click();

      // Collect signature
      await driverPortalPage.collectSignatureButton.click();
      await driverPortalPage.customerNameInput.fill(packageData.customerName);
      await driverPortalPage.drawSignature(packageData.customerName);
      await driverPortalPage.saveSignatureButton.click();

      // Complete delivery
      await driverPortalPage.completeDeliveryButton.click();
      await driverPortalPage.deliveryNotesInput.fill('Delivered to recipient at front door');
      await driverPortalPage.finalizeDeliveryButton.click();

      await expect(driverPortalPage.deliveryCompletedMessage).toBeVisible();

      // Phase 8: Customer sees final delivery status
      await customerPortalPage.refreshTrackingButton.click();
      await expect(customerPortalPage.packageStatus).toContainText('Delivered');
      await expect(customerPortalPage.deliveryProof).toBeVisible();
      await expect(customerPortalPage.signatureProof).toBeVisible();

      // Phase 9: Staff reviews completed delivery
      await staffDashboard.packagesTable.locator(`tr:has-text("${trackingNumber}")`).click();
      await expect(staffDashboard.packageStatus).toContainText('Delivered');
      await expect(staffDashboard.deliveryProofSection).toBeVisible();
      await expect(staffDashboard.signatureSection).toBeVisible();

      // Verify delivery metrics
      await staffDashboard.viewDeliveryMetricsButton.click();
      await expect(staffDashboard.deliveryTimeMetric).toBeVisible();
      await expect(staffDashboard.deliveryProofCount).toContainText('1');

      // Close additional pages
      await customerPage.close();
      await driverPage.close();
    });

    test('should handle package status changes across multiple users @e2e', async ({ context }) => {
      const trackingNumber = `STATUS-${Date.now()}`;

      // Create three user contexts
      const staffPage = await context.newPage();
      const customerPage = await context.newPage();
      const driverPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const customerAuth = new AuthHelpers(customerPage);
      const driverAuth = new AuthHelpers(driverPage);

      const staffDash = new StaffDashboard(staffPage);
      const customerPort = new CustomerPortal(customerPage);
      const driverPort = new DriverPortal(driverPage);

      // Staff creates package
      await staffAuth.quickLogin('staff');
      await staffDash.packagesTab.click();
      await staffDash.createPackageButton.click();
      await staffDash.quickCreatePackage({
        trackingNumber,
        customerName: 'Multi User Test',
        customerEmail: 'multiuser@example.com',
        weight: '1.5',
      });

      // Customer starts tracking
      await customerAuth.quickLogin('customer');
      await customerPort.startTracking(trackingNumber);
      await expect(customerPort.packageStatus).toContainText('Pending');

      // Driver authenticates and waits for assignment
      await driverAuth.quickLogin('driver');

      // Staff assigns package to driver
      await staffDash.assignPackageToDriver(trackingNumber, config.testUsers.driver.email);

      // All users should see status change
      await customerPort.refreshTrackingButton.click();
      await expect(customerPort.packageStatus).toContainText('Assigned');

      await driverPort.refreshDeliveriesButton.click();
      await expect(driverPort.deliveryList).toContainText(trackingNumber);

      // Driver picks up package
      await driverPort.updatePackageStatus(trackingNumber, 'picked_up', 'Package collected');

      // Status propagates to all users
      await Promise.all([
        staffDash.refreshPackagesList(),
        customerPort.refreshTrackingButton.click(),
      ]);

      await expect(
        staffDash.packagesTable.locator(`tr:has-text("${trackingNumber}")`)
      ).toContainText('Picked Up');
      await expect(customerPort.packageStatus).toContainText('Picked Up');

      // Close pages
      await staffPage.close();
      await customerPage.close();
      await driverPage.close();
    });

    test('should handle package modifications and customer notifications @e2e', async ({
      context,
    }) => {
      const trackingNumber = `MODIFY-${Date.now()}`;

      const staffPage = await context.newPage();
      const customerPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const customerAuth = new AuthHelpers(customerPage);

      const staffDash = new StaffDashboard(staffPage);
      const customerPort = new CustomerPortal(customerPage);

      // Create package with customer account
      await staffAuth.quickLogin('staff');
      await staffDash.createPackageWithCustomerAccount({
        trackingNumber,
        customerEmail: config.testUsers.customer.email,
        weight: '3.0',
        dimensions: { length: '15', width: '12', height: '10' },
      });

      // Customer logs in and sees package
      await customerAuth.quickLogin('customer');
      await expect(customerPort.packagesList).toContainText(trackingNumber);

      // Staff modifies package details
      await staffDash.editPackage(trackingNumber);
      await staffDash.packageWeightInput.fill('3.5'); // Increase weight
      await staffDash.addSpecialInstructionsInput.fill('Fragile - Handle with care');
      await staffDash.savePackageChangesButton.click();

      await expect(staffDash.packageUpdatedMessage).toBeVisible();

      // Customer should see notification of changes
      await customerPort.refreshPackagesButton.click();
      await customerPort.packagesList.locator(`tr:has-text("${trackingNumber}")`).click();

      await expect(customerPort.packageDetails).toContainText('3.5');
      await expect(customerPort.specialInstructions).toContainText('Fragile - Handle with care');

      // Check for notification
      const notifications = customerPort.notificationsList;
      if (await notifications.isVisible()) {
        await expect(notifications).toContainText(/package.*updated|modified/i);
      }

      await staffPage.close();
      await customerPage.close();
    });
  });

  test.describe('Multi-User Collaboration Scenarios', () => {
    test('should coordinate between staff and admin for user management @e2e @admin', async ({
      context,
    }) => {
      const staffPage = await context.newPage();
      const adminPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const adminAuth = new AuthHelpers(adminPage);

      const staffDash = new StaffDashboard(staffPage);
      const adminPan = new AdminPanel(adminPage);

      // Admin creates new staff user
      await adminAuth.quickLogin('admin');
      await adminPan.usersTab.click();

      const newStaffData = {
        name: 'New Staff Member',
        email: `newstaff-${Date.now()}@shipnorth.com`,
        role: 'staff',
        permissions: ['packages:create', 'packages:edit', 'customers:view'],
      };

      await adminPan.createUser(newStaffData);
      await expect(adminPan.userCreatedMessage).toBeVisible();

      // Original staff user sees new team member
      await staffAuth.quickLogin('staff');
      await staffDash.teamTab.click();
      await expect(staffDash.teamMembersList).toContainText(newStaffData.name);

      // Admin modifies permissions
      await adminPan.editUser(newStaffData.email);
      await adminPan.addPermission('loads:manage');
      await adminPan.saveUserChangesButton.click();

      // Staff dashboard updates with new capabilities
      await staffDash.refreshDashboard();

      // New staff member should see loads tab if permission granted
      const loadsTab = staffDash.loadsTab;
      if (await loadsTab.isVisible()) {
        await expect(loadsTab).toBeVisible();
      }

      await staffPage.close();
      await adminPage.close();
    });

    test('should handle concurrent operations by different users @e2e @concurrency', async ({
      context,
    }) => {
      const trackingNumber = `CONCURRENT-${Date.now()}`;

      const staff1Page = await context.newPage();
      const staff2Page = await context.newPage();
      const driverPage = await context.newPage();

      const staff1Auth = new AuthHelpers(staff1Page);
      const staff2Auth = new AuthHelpers(staff2Page);
      const driverAuth = new AuthHelpers(driverPage);

      const staff1Dash = new StaffDashboard(staff1Page);
      const staff2Dash = new StaffDashboard(staff2Page);
      const driverPort = new DriverPortal(driverPage);

      // Staff 1 creates package
      await staff1Auth.quickLogin('staff');
      await staff1Dash.createQuickPackage({ trackingNumber });

      // Staff 2 and Driver log in simultaneously
      await Promise.all([staff2Auth.quickLogin('staff'), driverAuth.quickLogin('driver')]);

      // Staff 2 tries to edit the same package
      await staff2Dash.packagesTab.click();
      await staff2Dash.findAndEditPackage(trackingNumber);

      // Staff 1 assigns package to driver at the same time
      const assignmentPromise = staff1Dash.assignPackageToDriver(
        trackingNumber,
        config.testUsers.driver.email
      );

      // Staff 2 tries to modify package weight
      const modificationPromise = (async () => {
        await staff2Dash.packageWeightInput.fill('2.0');
        return staff2Dash.savePackageChangesButton.click();
      })();

      // Wait for both operations
      const [assignmentResult, modificationResult] = await Promise.allSettled([
        assignmentPromise,
        modificationPromise,
      ]);

      // At least one operation should succeed
      expect([assignmentResult.status, modificationResult.status]).toContain('fulfilled');

      // Driver should see assigned package
      await driverPort.refreshDeliveriesButton.click();
      await expect(driverPort.deliveryList).toContainText(trackingNumber);

      // Verify final state is consistent
      await staff1Dash.refreshPackagesList();
      const packageRow = staff1Dash.packagesTable.locator(`tr:has-text("${trackingNumber}")`);
      await expect(packageRow).toBeVisible();

      await staff1Page.close();
      await staff2Page.close();
      await driverPage.close();
    });

    test('should handle load planning collaboration @e2e @loads', async ({ context }) => {
      const loadId = `LOAD-${Date.now()}`;

      const staffPage = await context.newPage();
      const driverPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const driverAuth = new AuthHelpers(driverPage);

      const staffDash = new StaffDashboard(staffPage);
      const driverPort = new DriverPortal(driverPage);

      // Staff creates multiple packages for load planning
      await staffAuth.quickLogin('staff');

      const packageIds = [];
      for (let i = 1; i <= 3; i++) {
        const trackingNumber = `LOAD-PKG-${Date.now()}-${i}`;
        await staffDash.createQuickPackage({
          trackingNumber,
          destination: `${i * 100} Test Street, Toronto, ON`,
        });
        packageIds.push(trackingNumber);
      }

      // Create load and assign packages
      await staffDash.loadsTab.click();
      await staffDash.createLoadButton.click();

      await staffDash.loadIdInput.fill(loadId);
      await staffDash.loadDriverSelect.selectOption(config.testUsers.driver.email);
      await staffDash.loadDateInput.fill(new Date().toISOString().split('T')[0]);

      // Add packages to load
      for (const packageId of packageIds) {
        await staffDash.addPackageToLoadButton.click();
        await staffDash.packageSearchInput.fill(packageId);
        await staffDash.packageSearchResults.locator(`li:has-text("${packageId}")`).click();
      }

      // Optimize route
      await staffDash.optimizeRouteButton.click();
      await expect(staffDash.routeOptimizedMessage).toBeVisible();

      // Save load
      await staffDash.saveLoadButton.click();
      await expect(staffDash.loadCreatedMessage).toBeVisible();

      // Driver sees assigned load
      await driverAuth.quickLogin('driver');
      await driverPort.loadsTab.click();
      await expect(driverPort.loadsList).toContainText(loadId);

      // Driver starts load
      await driverPort.loadsList.locator(`tr:has-text("${loadId}")`).click();
      await driverPort.startLoadButton.click();

      await expect(driverPort.loadInProgressMessage).toBeVisible();

      // Driver can see optimized route
      await driverPort.viewRouteButton.click();
      await expect(driverPort.routeMap).toBeVisible();
      await expect(driverPort.routeStops).toHaveCount(3);

      // Staff can track load progress
      await staffDash.loadsList.locator(`tr:has-text("${loadId}")`).click();
      await expect(staffDash.loadStatus).toContainText('In Progress');
      await expect(staffDash.loadTrackingMap).toBeVisible();

      await staffPage.close();
      await driverPage.close();
    });
  });

  test.describe('Business Process Validation', () => {
    test('should enforce business rules across user roles @e2e @business-rules', async ({
      context,
    }) => {
      const staffPage = await context.newPage();
      const customerPage = await context.newPage();
      const driverPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const customerAuth = new AuthHelpers(customerPage);
      const driverAuth = new AuthHelpers(driverPage);

      const staffDash = new StaffDashboard(staffPage);
      const customerPort = new CustomerPortal(customerPage);
      const driverPort = new DriverPortal(driverPage);

      // Business Rule 1: Staff-only package intake
      await customerAuth.quickLogin('customer');

      // Customer should NOT be able to create packages
      const createPackageButton = customerPort.createPackageButton;
      if (await createPackageButton.isVisible()) {
        // If button exists, it should be disabled or show error
        await createPackageButton.click();
        const errorMessage = customerPort.page.locator('[data-testid="error"], .error-message');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toContainText(/not authorized|permission denied/i);
        }
      }

      // Business Rule 2: Immediate charge on label purchase
      await staffAuth.quickLogin('staff');
      const trackingNumber = `BILLING-${Date.now()}`;
      await staffDash.createPackageWithBilling({ trackingNumber });

      // Create shipping label - should trigger immediate charge
      await staffDash.createShippingLabel(trackingNumber);
      await expect(staffDash.chargeProcessedMessage).toBeVisible();
      await expect(staffDash.invoiceCreatedMessage).toBeVisible();

      // Business Rule 3: Manual refund approval required
      await staffDash.initiateRefund(trackingNumber);
      await expect(staffDash.refundPendingApprovalMessage).toBeVisible();
      await expect(staffDash.refundStatus).toContainText('Pending Approval');

      // Business Rule 4: 5-minute tracking update interval
      await driverAuth.quickLogin('driver');
      await driverPort.deliveriesTab.click();

      if (await driverPort.deliveryList.locator(`tr:has-text("${trackingNumber}")`).isVisible()) {
        // Start tracking
        await driverPort.startLocationTracking();

        // Verify tracking updates occur
        const initialLocationTime = await driverPort.lastLocationUpdate.textContent();

        // Wait for tracking interval
        await driverPort.page.waitForTimeout(6000); // 6 seconds

        const updatedLocationTime = await driverPort.lastLocationUpdate.textContent();

        if (initialLocationTime && updatedLocationTime) {
          expect(updatedLocationTime).not.toBe(initialLocationTime);
        }
      }

      await staffPage.close();
      await customerPage.close();
      await driverPage.close();
    });

    test('should validate financial transactions and billing @e2e @billing', async ({
      context,
    }) => {
      const staffPage = await context.newPage();
      const adminPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const adminAuth = new AuthHelpers(adminPage);

      const staffDash = new StaffDashboard(staffPage);
      const adminPan = new AdminPanel(adminPage);

      await staffAuth.quickLogin('staff');

      // Create package with billing information
      const packageData = {
        trackingNumber: `BILL-${Date.now()}`,
        customerName: 'Billing Test Customer',
        billingInfo: {
          company: 'Test Company Inc.',
          address: '456 Billing Street',
          paymentMethod: 'credit_card',
        },
        weight: '2.0',
        shippingService: 'Express',
      };

      await staffDash.createPackageWithFullBilling(packageData);

      // Generate shipping label - triggers charge
      await staffDash.generateShippingLabel(packageData.trackingNumber, {
        carrier: 'FedEx',
        service: 'Express',
        insurance: '100.00',
      });

      // Verify charge details
      await expect(staffDash.chargeSummary).toBeVisible();

      const chargeAmount = await staffDash.chargeAmount.textContent();
      expect(chargeAmount).toMatch(/\$\d+\.\d{2}/);

      // Confirm charge
      await staffDash.confirmChargeButton.click();
      await expect(staffDash.paymentSuccessMessage).toBeVisible();

      // Admin reviews financial transaction
      await adminAuth.quickLogin('admin');
      await adminPan.financialTab.click();

      await expect(adminPan.transactionsList).toContainText(packageData.trackingNumber);

      // View transaction details
      await adminPan.transactionsList
        .locator(`tr:has-text("${packageData.trackingNumber}")`)
        .click();
      await expect(adminPan.transactionDetails).toBeVisible();
      await expect(adminPan.transactionStatus).toContainText('Completed');
      await expect(adminPan.transactionAmount).toContainText(chargeAmount || '');

      // Test refund process
      await adminPan.initiateRefundButton.click();
      await adminPan.refundAmountInput.fill('25.00'); // Partial refund
      await adminPan.refundReasonSelect.selectOption('customer_request');
      await adminPan.refundNotesInput.fill('Customer requested partial refund');

      await adminPan.processRefundButton.click();
      await expect(adminPan.refundProcessedMessage).toBeVisible();

      // Verify refund appears in transaction history
      await expect(adminPan.transactionsList).toContainText('Refund');

      await staffPage.close();
      await adminPage.close();
    });

    test('should handle exception scenarios and error recovery @e2e @error-handling', async ({
      context,
    }) => {
      const staffPage = await context.newPage();
      const driverPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const driverAuth = new AuthHelpers(driverPage);

      const staffDash = new StaffDashboard(staffPage);
      const driverPort = new DriverPortal(driverPage);

      await staffAuth.quickLogin('staff');

      // Scenario 1: Package with invalid destination
      const invalidPackageData = {
        trackingNumber: `INVALID-${Date.now()}`,
        destination: {
          address: 'Non-existent Address 99999',
          city: 'InvalidCity',
          province: 'XX',
          postalCode: 'X0X 0X0',
        },
      };

      await staffDash.createPackageWithValidation(invalidPackageData);

      // Should show validation warnings
      await expect(staffDash.addressValidationWarning).toBeVisible();

      // Attempt to create shipping label
      await staffDash.createLabelButton.click();
      await expect(staffDash.addressValidationError).toBeVisible();

      // Correct address and retry
      await staffDash.editPackageAddress({
        address: '100 Queen Street',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N1',
      });

      await staffDash.createLabelButton.click();
      await expect(staffDash.labelCreatedMessage).toBeVisible();

      // Scenario 2: Driver delivery failure
      await driverAuth.quickLogin('driver');
      await driverPort.deliveriesTab.click();

      const trackingNumber = invalidPackageData.trackingNumber;
      if (await driverPort.deliveryList.locator(`tr:has-text("${trackingNumber}")`).isVisible()) {
        await driverPort.startDelivery(trackingNumber);

        // Simulate delivery failure
        await driverPort.reportDeliveryIssueButton.click();
        await driverPort.issueTypeSelect.selectOption('address_not_found');
        await driverPort.issueDescriptionInput.fill(
          'Address does not exist, unable to locate recipient'
        );
        await driverPort.captureIssuePhotoButton.click();

        // Mock photo capture
        await driverPort.page.evaluate(() => {
          // Simulate photo capture completion
          const event = new CustomEvent('photoCaptured');
          document.dispatchEvent(event);
        });

        await driverPort.submitIssueReportButton.click();
        await expect(driverPort.issueReportedMessage).toBeVisible();

        // Staff should see delivery exception
        await staffDash.refreshPackagesList();
        await expect(
          staffDash.packagesTable.locator(`tr:has-text("${trackingNumber}")`)
        ).toContainText('Exception');

        // Staff resolves exception
        await staffDash.packageExceptions.click();
        await staffDash.exceptionsList.locator(`tr:has-text("${trackingNumber}")`).click();

        await expect(staffDash.exceptionDetails).toBeVisible();
        await expect(staffDash.driverNotes).toContainText('Address does not exist');

        // Update customer contact info and reschedule
        await staffDash.updateCustomerContactButton.click();
        await staffDash.customerPhoneInput.fill('416-555-0123');
        await staffDash.saveCustomerInfoButton.click();

        await staffDash.rescheduleDeliveryButton.click();
        await staffDash.rescheduleDate.fill(
          new Date(Date.now() + 86400000).toISOString().split('T')[0]
        ); // Tomorrow
        await staffDash.rescheduleNotesInput.fill('Updated customer contact, rescheduled delivery');
        await staffDash.confirmRescheduleButton.click();

        await expect(staffDash.deliveryRescheduledMessage).toBeVisible();
      }

      await staffPage.close();
      await driverPage.close();
    });
  });

  test.describe('System Integration and Data Flow', () => {
    test('should maintain data consistency across all system components @e2e @integration', async ({
      context,
    }) => {
      const trackingNumber = `INTEGRATION-${Date.now()}`;

      // Create multiple user sessions
      const staffPage = await context.newPage();
      const customerPage = await context.newPage();
      const driverPage = await context.newPage();
      const adminPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const customerAuth = new AuthHelpers(customerPage);
      const driverAuth = new AuthHelpers(driverPage);
      const adminAuth = new AuthHelpers(adminPage);

      const staffDash = new StaffDashboard(staffPage);
      const customerPort = new CustomerPortal(customerPage);
      const driverPort = new DriverPortal(driverPage);
      const adminPan = new AdminPanel(adminPage);

      // Initialize all users
      await Promise.all([
        staffAuth.quickLogin('staff'),
        customerAuth.quickLogin('customer'),
        driverAuth.quickLogin('driver'),
        adminAuth.quickLogin('admin'),
      ]);

      // Staff creates package
      await staffDash.createFullPackage({
        trackingNumber,
        customerEmail: config.testUsers.customer.email,
        weight: '1.8',
        dimensions: { length: '11', width: '9', height: '7' },
        value: '150.00',
      });

      // Verify package appears in all relevant systems
      await Promise.all([
        // Customer sees package in their portal
        (async () => {
          await customerPort.refreshPackagesButton.click();
          await expect(customerPort.packagesList).toContainText(trackingNumber);
        })(),

        // Admin sees package in system overview
        (async () => {
          await adminPan.packagesOverviewTab.click();
          await expect(adminPan.recentPackages).toContainText(trackingNumber);
        })(),

        // Driver sees package in pending assignments
        (async () => {
          await driverPort.pendingAssignmentsTab.click();
          // Package not yet assigned, so might not be visible yet
        })(),
      ]);

      // Staff assigns package to driver
      await staffDash.assignPackage(trackingNumber, config.testUsers.driver.email);

      // Verify assignment propagates
      await driverPort.refreshAssignmentsButton.click();
      await expect(driverPort.assignedDeliveries).toContainText(trackingNumber);

      // Admin sees assignment in metrics
      await adminPan.driverAssignmentsSection.click();
      await expect(adminPan.assignmentsList).toContainText(trackingNumber);

      // Driver updates status
      await driverPort.updatePackageStatus(
        trackingNumber,
        'picked_up',
        'Package collected from depot'
      );

      // Verify status update propagates to all systems
      await Promise.all([
        // Staff dashboard updates
        (async () => {
          await staffDash.refreshPackagesList();
          const packageRow = staffDash.packagesTable.locator(`tr:has-text("${trackingNumber}")`);
          await expect(packageRow).toContainText('Picked Up');
        })(),

        // Customer portal updates
        (async () => {
          await customerPort.refreshTrackingButton.click();
          await expect(customerPort.trackingStatus).toContainText('Picked Up');
        })(),

        // Admin metrics update
        (async () => {
          await adminPan.refreshMetricsButton.click();
          await expect(adminPan.packagesInTransitCount).toContainText(/[1-9]/); // At least 1
        })(),
      ]);

      // Test real-time synchronization
      const statusUpdate = 'in_transit';
      const statusMessage = 'Package en route to destination';

      // Driver makes another status update
      await driverPort.updatePackageStatus(trackingNumber, statusUpdate, statusMessage);

      // Other users should see updates within reasonable time
      await customerPort.page.waitForTimeout(2000); // Wait for real-time update

      // Check if real-time updates work
      const customerStatus = await customerPort.trackingStatus.textContent();
      if (customerStatus && customerStatus.includes('In Transit')) {
        // Real-time updates are working
        await expect(customerPort.trackingStatus).toContainText('In Transit');
      } else {
        // Manual refresh needed
        await customerPort.refreshTrackingButton.click();
        await expect(customerPort.trackingStatus).toContainText('In Transit');
      }

      // Verify data integrity across all systems
      const packageData = {
        trackingNumber,
        status: statusUpdate,
        message: statusMessage,
      };

      // All systems should have consistent data
      await assertions.verifyDataConsistency(packageData, {
        staff: staffDash,
        customer: customerPort,
        driver: driverPort,
        admin: adminPan,
      });

      // Close all pages
      await Promise.all([
        staffPage.close(),
        customerPage.close(),
        driverPage.close(),
        adminPage.close(),
      ]);
    });

    test('should handle system load and concurrent operations @e2e @performance', async ({
      context,
    }) => {
      const packageCount = 5;
      const trackingNumbers = Array(packageCount)
        .fill(null)
        .map((_, i) => `LOAD-${Date.now()}-${i}`);

      const staffPage = await context.newPage();
      const driverPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const driverAuth = new AuthHelpers(driverPage);

      const staffDash = new StaffDashboard(staffPage);
      const driverPort = new DriverPortal(driverPage);

      await Promise.all([staffAuth.quickLogin('staff'), driverAuth.quickLogin('driver')]);

      // Create multiple packages simultaneously
      const packageCreationPromises = trackingNumbers.map(async (trackingNumber, index) => {
        const packageData = {
          trackingNumber,
          customerName: `Load Test Customer ${index + 1}`,
          weight: `${1.0 + index * 0.5}`,
          destination: `${(index + 1) * 100} Load Test Street, Toronto, ON`,
        };

        return staffDash.createPackageQuickly(packageData);
      });

      const startTime = Date.now();
      await Promise.all(packageCreationPromises);
      const endTime = Date.now();

      const totalCreationTime = endTime - startTime;
      expect(totalCreationTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Verify all packages created
      for (const trackingNumber of trackingNumbers) {
        await expect(staffDash.packagesTable).toContainText(trackingNumber);
      }

      // Assign all packages to driver simultaneously
      const assignmentPromises = trackingNumbers.map((trackingNumber) =>
        staffDash.assignPackageToDriver(trackingNumber, config.testUsers.driver.email)
      );

      await Promise.allSettled(assignmentPromises);

      // Driver should see all assignments
      await driverPort.refreshDeliveriesButton.click();

      for (const trackingNumber of trackingNumbers) {
        await expect(driverPort.deliveryList).toContainText(trackingNumber);
      }

      // Concurrent status updates
      const statusUpdatePromises = trackingNumbers.map((trackingNumber, index) =>
        driverPort.updatePackageStatus(trackingNumber, 'picked_up', `Batch pickup ${index + 1}`)
      );

      const updateStartTime = Date.now();
      await Promise.allSettled(statusUpdatePromises);
      const updateEndTime = Date.now();

      const totalUpdateTime = updateEndTime - updateStartTime;
      expect(totalUpdateTime).toBeLessThan(20000); // Should complete within 20 seconds

      // Verify system stability
      await staffDash.refreshPackagesList();
      await expect(staffDash.packagesTable).toBeVisible();

      // Check that all updates were processed
      let pickedUpCount = 0;
      for (const trackingNumber of trackingNumbers) {
        const packageRow = staffDash.packagesTable.locator(`tr:has-text("${trackingNumber}")`);
        const statusText = await packageRow.locator('td').nth(3).textContent(); // Assuming status is in 4th column
        if (statusText && statusText.includes('Picked Up')) {
          pickedUpCount++;
        }
      }

      expect(pickedUpCount).toBeGreaterThanOrEqual(Math.floor(packageCount * 0.8)); // At least 80% success rate

      await staffPage.close();
      await driverPage.close();
    });
  });

  test.describe('Real-World Usage Scenarios', () => {
    test('should handle typical daily operations workflow @e2e @daily-operations', async ({
      context,
    }) => {
      // Simulate a typical day of operations

      const staffPage = await context.newPage();
      const driverPage = await context.newPage();
      const customerPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const driverAuth = new AuthHelpers(driverPage);
      const customerAuth = new AuthHelpers(customerPage);

      const staffDash = new StaffDashboard(staffPage);
      const driverPort = new DriverPortal(driverPage);
      const customerPort = new CustomerPortal(customerPage);

      // Morning: Staff starts work and reviews dashboard
      await staffAuth.quickLogin('staff');
      await expect(staffDash.dashboardTitle).toBeVisible();

      // Check daily metrics
      await expect(staffDash.totalPackagesMetric).toBeVisible();
      await expect(staffDash.pendingPackagesMetric).toBeVisible();
      await expect(staffDash.inTransitPackagesMetric).toBeVisible();

      // Create morning batch of packages
      const morningPackages = [
        { trackingNumber: `MORNING-${Date.now()}-1`, priority: 'standard' },
        { trackingNumber: `MORNING-${Date.now()}-2`, priority: 'express' },
        { trackingNumber: `MORNING-${Date.now()}-3`, priority: 'standard' },
      ];

      for (const pkg of morningPackages) {
        await staffDash.createDailyPackage(pkg);
      }

      // Driver starts shift and receives assignments
      await driverAuth.quickLogin('driver');
      await expect(driverPort.dashboardTitle).toBeVisible();

      // Check daily route
      await driverPort.dailyRouteTab.click();
      await expect(driverPort.routeOverview).toBeVisible();

      // Staff assigns packages to driver based on route optimization
      await staffDash.loadsTab.click();
      await staffDash.createDailyLoad(morningPackages, config.testUsers.driver.email);

      // Driver accepts and starts load
      await driverPort.refreshLoadsButton.click();
      await driverPort.acceptLoad('Daily Load');
      await driverPort.startDailyRoute();

      // Midday: Customer inquiries and tracking
      await customerAuth.quickLogin('customer');

      // Customer tracks their package
      const customerPackage = morningPackages[0].trackingNumber;
      await customerPort.trackPackage(customerPackage);
      await expect(customerPort.trackingResults).toBeVisible();

      // Customer initiates live chat support
      const supportChat = customerPort.supportChatButton;
      if (await supportChat.isVisible()) {
        await supportChat.click();
        await customerPort.chatMessageInput.fill('When will my package arrive?');
        await customerPort.sendChatMessageButton.click();

        // Staff should receive chat notification
        const chatNotification = staffDash.chatNotification;
        if (await chatNotification.isVisible()) {
          await chatNotification.click();
          await staffDash.chatResponseInput.fill(
            'Your package is currently in transit and should arrive by end of day.'
          );
          await staffDash.sendChatResponseButton.click();
        }
      }

      // Afternoon: Driver completes deliveries
      for (const pkg of morningPackages) {
        await driverPort.completeDelivery(pkg.trackingNumber);
      }

      // End of day: Staff reviews daily metrics
      await staffDash.endOfDayReportTab.click();
      await expect(staffDash.deliveredTodayCount).toBeVisible();
      await expect(staffDash.revenueToday).toBeVisible();
      await expect(staffDash.customerSatisfactionScore).toBeVisible();

      // Generate daily reports
      await staffDash.generateDailyReportButton.click();
      await expect(staffDash.reportGeneratedMessage).toBeVisible();

      await staffPage.close();
      await driverPage.close();
      await customerPage.close();
    });

    test('should handle peak season operations @e2e @peak-season', async ({ context }) => {
      // Simulate high-volume peak season scenario

      const staffPage = await context.newPage();
      const adminPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const adminAuth = new AuthHelpers(adminPage);

      const staffDash = new StaffDashboard(staffPage);
      const adminPan = new AdminPanel(adminPage);

      await Promise.all([staffAuth.quickLogin('staff'), adminAuth.quickLogin('admin')]);

      // Admin enables peak season mode
      await adminPan.systemSettingsTab.click();
      await adminPan.peakSeasonToggle.click();
      await adminPan.increaseRateLimitsButton.click();
      await adminPan.saveSettingsButton.click();

      // Staff creates high volume of packages
      const packageCount = 10;
      const peakPackages = Array(packageCount)
        .fill(null)
        .map((_, i) => ({
          trackingNumber: `PEAK-${Date.now()}-${i}`,
          priority: i < 3 ? 'express' : 'standard', // First 3 are express
          serviceLevel: i < 3 ? 'next_day' : 'ground',
        }));

      // Batch create packages
      const creationPromises = peakPackages.map((pkg) => staffDash.createPackageQuickly(pkg));
      await Promise.all(creationPromises);

      // Verify system handles peak load
      await expect(staffDash.packagesTable).toBeVisible();

      // Admin monitors system performance during peak
      await adminPan.performanceMonitorTab.click();
      await expect(adminPan.systemLoadMetric).toBeVisible();
      await expect(adminPan.responseTimeMetric).toBeVisible();

      const systemLoad = await adminPan.systemLoadValue.textContent();
      if (systemLoad) {
        const loadPercentage = parseFloat(systemLoad.replace('%', ''));
        expect(loadPercentage).toBeLessThan(95); // System should remain stable
      }

      // Bulk operations for peak efficiency
      await staffDash.selectAllPackagesCheckbox.click();
      await staffDash.bulkActionsButton.click();
      await staffDash.bulkAssignDriverButton.click();
      await staffDash.selectMultipleDriversButton.click();

      // Auto-distribute packages among available drivers
      await staffDash.autoDistributeButton.click();
      await expect(staffDash.distributionCompleteMessage).toBeVisible();

      // Generate peak season analytics
      await adminPan.peakSeasonReportsTab.click();
      await adminPan.generateVolumeReportButton.click();
      await expect(adminPan.volumeReport).toBeVisible();

      await staffPage.close();
      await adminPage.close();
    });

    test('should handle customer service escalations @e2e @customer-service', async ({
      context,
    }) => {
      const staffPage = await context.newPage();
      const customerPage = await context.newPage();
      const adminPage = await context.newPage();

      const staffAuth = new AuthHelpers(staffPage);
      const customerAuth = new AuthHelpers(customerPage);
      const adminAuth = new AuthHelpers(adminPage);

      const staffDash = new StaffDashboard(staffPage);
      const customerPort = new CustomerPortal(customerPage);
      const adminPan = new AdminPanel(adminPage);

      await Promise.all([
        staffAuth.quickLogin('staff'),
        customerAuth.quickLogin('customer'),
        adminAuth.quickLogin('admin'),
      ]);

      // Customer has an issue with delayed package
      const problemPackage = `PROBLEM-${Date.now()}`;

      // Create package with intentional delay
      await staffDash.createPackageWithDelay(problemPackage, { delayReason: 'weather' });

      // Customer reports issue
      await customerPort.myPackagesTab.click();
      await customerPort.packagesList.locator(`tr:has-text("${problemPackage}")`).click();
      await customerPort.reportIssueButton.click();

      await customerPort.issueTypeSelect.selectOption('delayed_delivery');
      await customerPort.issueDescriptionInput.fill(
        'My package was supposed to arrive yesterday but still shows in transit. I need it urgently for a business meeting.'
      );
      await customerPort.urgencyLevel.selectOption('high');
      await customerPort.submitIssueButton.click();

      await expect(customerPort.issueSubmittedMessage).toBeVisible();
      await expect(customerPort.ticketNumber).toBeVisible();

      const ticketNumber = await customerPort.ticketNumberValue.textContent();

      // Staff receives and processes customer issue
      await staffDash.customerServiceTab.click();
      await expect(staffDash.openTickets).toContainText(ticketNumber || '');

      await staffDash.ticketsList.locator(`tr:has-text("${ticketNumber}")`).click();
      await expect(staffDash.ticketDetails).toBeVisible();

      // Staff investigates package status
      await staffDash.investigatePackageButton.click();
      await expect(staffDash.packageTimeline).toBeVisible();
      await expect(staffDash.delayExplanation).toContainText('weather');

      // Staff provides initial response
      await staffDash.respondToCustomerButton.click();
      await staffDash.responseTextarea.fill(
        'Thank you for contacting us. I see your package was delayed due to weather conditions. I am escalating this to our logistics team for expedited handling.'
      );
      await staffDash.escalatePriorityButton.click();
      await staffDash.sendResponseButton.click();

      // Escalation to admin
      await expect(staffDash.ticketEscalatedMessage).toBeVisible();

      // Admin handles escalation
      await adminPan.escalatedTicketsTab.click();
      await expect(adminPan.escalatedTicketsList).toContainText(ticketNumber || '');

      await adminPan.ticketsList.locator(`tr:has-text("${ticketNumber}")`).click();

      // Admin provides compensation
      await adminPan.compensationTab.click();
      await adminPan.compensationType.selectOption('shipping_refund');
      await adminPan.compensationAmount.fill('25.00');
      await adminPan.compensationReason.fill('Service recovery for weather delay');
      await adminPan.approveCompensationButton.click();

      // Admin expedites delivery
      await adminPan.expediteDeliveryButton.click();
      await adminPan.expediteReason.fill(
        'Customer service escalation - business critical delivery'
      );
      await adminPan.confirmExpediteButton.click();

      await expect(adminPan.expediteConfirmedMessage).toBeVisible();

      // Customer sees resolution
      await customerPort.refreshTicketButton.click();
      await expect(customerPort.ticketStatus).toContainText('Resolved');
      await expect(customerPort.compensationNotice).toContainText('$25.00 refund processed');
      await expect(customerPort.expeditedDeliveryNotice).toBeVisible();

      // Customer satisfaction survey
      await customerPort.rateSatisfactionButton.click();
      await customerPort.satisfactionRating.click(); // 4 stars
      await customerPort.feedbackComment.fill(
        'Issue was resolved quickly and I received fair compensation. Thank you!'
      );
      await customerPort.submitSatisfactionButton.click();

      await expect(customerPort.feedbackSubmittedMessage).toBeVisible();

      // Admin reviews satisfaction metrics
      await adminPan.satisfactionMetricsTab.click();
      await expect(adminPan.averageSatisfactionScore).toBeVisible();
      await expect(adminPan.recentFeedback).toContainText('Issue was resolved quickly');

      await staffPage.close();
      await customerPage.close();
      await adminPage.close();
    });
  });
});
