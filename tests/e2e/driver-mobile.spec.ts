import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { DriverPortal } from './utils/page-objects';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';

/**
 * Driver Mobile Interface - Comprehensive Test Suite
 *
 * Consolidates:
 * - comprehensive-driver.spec.ts
 * - driver-mobile.spec.ts
 * - driver-portal.spec.ts
 * - gps-tracking.spec.ts
 * - package-scanning.spec.ts
 * - photo-upload.spec.ts
 * - signature-capture.spec.ts
 * - manifest-display.spec.ts
 *
 * Coverage:
 * - Portal access and authentication
 * - GPS tracking and location services
 * - Package scanning (QR/Barcode)
 * - Photo capture and upload
 * - Signature collection
 * - Delivery workflow management
 * - Mobile optimization and responsive design
 * - Error handling and recovery
 * - Performance monitoring
 */

test.describe('Driver Mobile Interface', () => {
  let authHelpers: AuthHelpers;
  let driverPortal: DriverPortal;
  let assertions: CustomAssertions;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    driverPortal = new DriverPortal(page);
    assertions = new CustomAssertions(page);

    // Authenticate as driver
    await authHelpers.quickLogin('driver');
    await authHelpers.waitForLoadingToComplete();
  });

  test.describe('Portal Access and Navigation', () => {
    test('should display driver portal dashboard @smoke', async () => {
      await expect(driverPortal.dashboardTitle).toBeVisible();
      await expect(driverPortal.navigationMenu).toBeVisible();
      await expect(driverPortal.deliveryList).toBeVisible();

      // Verify driver-specific features
      await expect(driverPortal.startRouteButton).toBeVisible();
      await expect(driverPortal.currentLocationButton).toBeVisible();
      await expect(driverPortal.scanPackageButton).toBeVisible();
    });

    test('should navigate between portal sections', async () => {
      const sections = [
        { tab: driverPortal.deliveriesTab, content: driverPortal.deliveryList },
        { tab: driverPortal.routesTab, content: driverPortal.routeMap },
        { tab: driverPortal.scansTab, content: driverPortal.scanHistory },
        { tab: driverPortal.profileTab, content: driverPortal.profileForm },
      ];

      for (const section of sections) {
        await section.tab.click();
        await expect(section.content).toBeVisible();
        await assertions.checkPerformanceMetrics(2000);
      }
    });

    test('should handle mobile navigation menu', async ({ page }) => {
      await assertions.testMobileNavigation(page);

      // Test mobile-specific driver features
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      await expect(driverPortal.mobileMenuButton).toBeVisible();
      await driverPortal.mobileMenuButton.click();
      await expect(driverPortal.mobileNavigationMenu).toBeVisible();

      // Test quick actions in mobile mode
      await expect(driverPortal.quickScanButton).toBeVisible();
      await expect(driverPortal.emergencyContactButton).toBeVisible();
    });
  });

  test.describe('GPS Tracking and Location Services', () => {
    test('should enable location tracking @gps', async ({ page, context }) => {
      // Grant geolocation permissions
      await context.grantPermissions(['geolocation']);

      // Set mock location
      await page.setGeolocation({
        latitude: 43.6532,
        longitude: -79.3832, // Toronto coordinates
      });

      await driverPortal.enableLocationButton.click();
      await expect(driverPortal.locationStatus).toContainText('Location tracking enabled');
      await expect(driverPortal.currentLocationDisplay).toBeVisible();

      // Verify location updates
      await expect(driverPortal.coordinatesDisplay).toContainText('43.6532');
      await expect(driverPortal.coordinatesDisplay).toContainText('-79.3832');
    });

    test('should display route on map @gps', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await page.setGeolocation({ latitude: 43.6532, longitude: -79.3832 });

      await driverPortal.viewRouteButton.click();
      await expect(driverPortal.mapContainer).toBeVisible();

      // Check for map markers and route
      await expect(driverPortal.deliveryMarkers).toHaveCount.greaterThan(0);
      await expect(driverPortal.routeLine).toBeVisible();
      await expect(driverPortal.currentLocationMarker).toBeVisible();
    });

    test('should handle GPS errors gracefully @gps', async ({ page, context }) => {
      // Deny geolocation permissions to simulate GPS error
      await context.grantPermissions([]);

      await driverPortal.enableLocationButton.click();

      // Should show appropriate error message
      await expect(driverPortal.errorMessage).toContainText(/location.*denied|GPS.*unavailable/i);
      await expect(driverPortal.manualLocationButton).toBeVisible();

      // Test manual location entry
      await driverPortal.manualLocationButton.click();
      await driverPortal.addressInput.fill('123 Main St, Toronto, ON');
      await driverPortal.confirmLocationButton.click();

      await expect(driverPortal.locationStatus).toContainText('Manual location set');
    });

    test('should track location during delivery route @gps @performance', async ({
      page,
      context,
    }) => {
      await context.grantPermissions(['geolocation']);

      // Start route
      await page.setGeolocation({ latitude: 43.6532, longitude: -79.3832 });
      await driverPortal.startRouteButton.click();

      // Simulate movement along route
      const routePoints = [
        { latitude: 43.6532, longitude: -79.3832 },
        { latitude: 43.6542, longitude: -79.3822 },
        { latitude: 43.6552, longitude: -79.3812 },
      ];

      for (const point of routePoints) {
        await page.setGeolocation(point);
        await page.waitForTimeout(2000); // Simulate movement time

        await expect(driverPortal.currentLocationDisplay).toContainText(point.latitude.toString());
      }

      // Verify route tracking performance
      await assertions.checkPerformanceMetrics(3000);
    });
  });

  test.describe('Package Scanning', () => {
    test('should scan package QR codes @scanning', async ({ page, context }) => {
      // Grant camera permissions
      await context.grantPermissions(['camera']);

      await driverPortal.scanPackageButton.click();
      await expect(driverPortal.cameraView).toBeVisible();

      // Simulate successful QR scan
      const testPackageId = TestData.packages.testPackage.trackingNumber;
      await driverPortal.simulateQRScan(testPackageId);

      // Verify package details loaded
      await expect(driverPortal.packageDetails).toBeVisible();
      await expect(driverPortal.packageId).toContainText(testPackageId);
      await expect(driverPortal.customerName).toContainText(
        TestData.packages.testPackage.customerName
      );
    });

    test('should scan package barcodes @scanning', async ({ page, context }) => {
      await context.grantPermissions(['camera']);

      await driverPortal.scanPackageButton.click();
      await driverPortal.switchToBarcodeMode.click();

      // Simulate barcode scan
      const testBarcode = TestData.packages.testPackage.barcode;
      await driverPortal.simulateBarcodeScan(testBarcode);

      await expect(driverPortal.packageDetails).toBeVisible();
      await expect(driverPortal.barcodeDisplay).toContainText(testBarcode);
    });

    test('should handle invalid scan codes @scanning', async ({ page, context }) => {
      await context.grantPermissions(['camera']);

      await driverPortal.scanPackageButton.click();

      // Simulate invalid QR scan
      await driverPortal.simulateQRScan('INVALID_CODE_123');

      await expect(driverPortal.errorMessage).toContainText(/package not found|invalid code/i);
      await expect(driverPortal.retryButton).toBeVisible();
      await expect(driverPortal.manualEntryButton).toBeVisible();
    });

    test('should allow manual package entry @scanning', async () => {
      await driverPortal.scanPackageButton.click();
      await driverPortal.manualEntryButton.click();

      await expect(driverPortal.manualEntryForm).toBeVisible();

      const testPackageId = TestData.packages.testPackage.trackingNumber;
      await driverPortal.packageIdInput.fill(testPackageId);
      await driverPortal.confirmPackageButton.click();

      await expect(driverPortal.packageDetails).toBeVisible();
      await expect(driverPortal.packageId).toContainText(testPackageId);
    });

    test('should maintain scan history @scanning', async ({ context }) => {
      await context.grantPermissions(['camera']);

      const scanCodes = ['PKG001', 'PKG002', 'PKG003'];

      for (const code of scanCodes) {
        await driverPortal.scanPackageButton.click();
        await driverPortal.simulateQRScan(code);
        await driverPortal.closePackageDetails.click();
      }

      // Check scan history
      await driverPortal.scansTab.click();
      await expect(driverPortal.scanHistory).toBeVisible();

      for (const code of scanCodes) {
        await expect(driverPortal.scanHistoryList).toContainText(code);
      }
    });
  });

  test.describe('Photo Capture and Upload', () => {
    test('should capture package photos @photos', async ({ page, context }) => {
      await context.grantPermissions(['camera']);

      // Navigate to photo capture from package details
      await driverPortal.scanPackageButton.click();
      await driverPortal.simulateQRScan(TestData.packages.testPackage.trackingNumber);

      await driverPortal.addPhotoButton.click();
      await expect(driverPortal.cameraView).toBeVisible();

      // Simulate photo capture
      await driverPortal.capturePhotoButton.click();

      // Verify photo preview and upload
      await expect(driverPortal.photoPreview).toBeVisible();
      await expect(driverPortal.uploadPhotoButton).toBeVisible();

      await driverPortal.uploadPhotoButton.click();
      await expect(driverPortal.uploadProgress).toBeVisible();
      await expect(driverPortal.photoUploadedMessage).toBeVisible();
    });

    test('should capture delivery proof photos @photos', async ({ context }) => {
      await context.grantPermissions(['camera']);

      // Start delivery process
      await driverPortal.deliveriesTab.click();
      await driverPortal.deliveryItems.first().click();
      await driverPortal.startDeliveryButton.click();

      // Capture proof of delivery
      await driverPortal.proofOfDeliveryButton.click();
      await expect(driverPortal.cameraView).toBeVisible();

      await driverPortal.capturePhotoButton.click();
      await driverPortal.uploadPhotoButton.click();

      await expect(driverPortal.deliveryProofUploaded).toBeVisible();
      await expect(driverPortal.completeDeliveryButton).toBeEnabled();
    });

    test('should handle photo upload errors @photos', async ({ page, context }) => {
      await context.grantPermissions(['camera']);

      // Simulate network error during upload
      await page.route('**/api/photos/upload', (route) => route.abort());

      await driverPortal.addPhotoButton.click();
      await driverPortal.capturePhotoButton.click();
      await driverPortal.uploadPhotoButton.click();

      await expect(driverPortal.uploadErrorMessage).toContainText(/upload failed|network error/i);
      await expect(driverPortal.retryUploadButton).toBeVisible();
      await expect(driverPortal.saveLocallyButton).toBeVisible();
    });

    test('should manage photo gallery @photos', async ({ context }) => {
      await context.grantPermissions(['camera']);

      // Capture multiple photos
      const photoCount = 3;
      for (let i = 0; i < photoCount; i++) {
        await driverPortal.addPhotoButton.click();
        await driverPortal.capturePhotoButton.click();
        await driverPortal.uploadPhotoButton.click();
        await driverPortal.closePhotoPreview.click();
      }

      // View photo gallery
      await driverPortal.viewPhotosButton.click();
      await expect(driverPortal.photoGallery).toBeVisible();
      await expect(driverPortal.photoThumbnails).toHaveCount(photoCount);

      // Test photo deletion
      await driverPortal.photoThumbnails.first().click();
      await driverPortal.deletePhotoButton.click();
      await driverPortal.confirmDeleteButton.click();

      await expect(driverPortal.photoThumbnails).toHaveCount(photoCount - 1);
    });
  });

  test.describe('Signature Collection', () => {
    test('should collect customer signatures @signatures', async () => {
      // Start delivery process
      await driverPortal.deliveriesTab.click();
      await driverPortal.deliveryItems.first().click();
      await driverPortal.startDeliveryButton.click();

      // Collect signature
      await driverPortal.collectSignatureButton.click();
      await expect(driverPortal.signatureCanvas).toBeVisible();
      await expect(driverPortal.signatureInstructions).toBeVisible();

      // Simulate signature drawing
      await driverPortal.drawSignature('John Doe');

      // Verify signature and save
      await expect(driverPortal.signaturePreview).toBeVisible();
      await driverPortal.saveSignatureButton.click();

      await expect(driverPortal.signatureCollectedMessage).toBeVisible();
      await expect(driverPortal.completeDeliveryButton).toBeEnabled();
    });

    test('should validate signature requirements @signatures', async () => {
      await driverPortal.collectSignatureButton.click();

      // Try to save empty signature
      await driverPortal.saveSignatureButton.click();
      await expect(driverPortal.signatureRequiredError).toContainText(/signature required/i);

      // Draw minimal signature (should be rejected)
      await driverPortal.drawMinimalSignature();
      await driverPortal.saveSignatureButton.click();
      await expect(driverPortal.signatureInvalidError).toContainText(/signature too simple/i);

      // Draw valid signature
      await driverPortal.clearSignature.click();
      await driverPortal.drawSignature('Valid Signature');
      await driverPortal.saveSignatureButton.click();

      await expect(driverPortal.signatureCollectedMessage).toBeVisible();
    });

    test('should handle signature canvas interactions @signatures', async ({ page }) => {
      await driverPortal.collectSignatureButton.click();

      // Test touch/mouse interactions
      const canvas = driverPortal.signatureCanvas;
      await expect(canvas).toBeVisible();

      // Draw signature with mouse events
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 100);
        await page.mouse.up();
      }

      // Test clear function
      await driverPortal.clearSignature.click();
      await expect(driverPortal.signatureCanvas).toHaveAttribute('data-empty', 'true');
    });

    test('should save signature with customer info @signatures', async () => {
      await driverPortal.collectSignatureButton.click();

      // Fill customer information
      await driverPortal.customerNameInput.fill('John Doe');
      await driverPortal.customerRelationInput.fill('Recipient');

      // Draw and save signature
      await driverPortal.drawSignature('John Doe');
      await driverPortal.saveSignatureButton.click();

      // Verify signature details are saved
      await expect(driverPortal.signatureDetails).toContainText('John Doe');
      await expect(driverPortal.signatureDetails).toContainText('Recipient');
      await expect(driverPortal.signatureTimestamp).toBeVisible();
    });
  });

  test.describe('Delivery Workflow Management', () => {
    test('should complete full delivery workflow @workflow', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'geolocation']);
      await page.setGeolocation({ latitude: 43.6532, longitude: -79.3832 });

      // Start with package scan
      await driverPortal.scanPackageButton.click();
      await driverPortal.simulateQRScan(TestData.packages.testPackage.trackingNumber);

      // Begin delivery
      await driverPortal.startDeliveryButton.click();
      await expect(driverPortal.deliveryInProgress).toBeVisible();

      // Capture proof photo
      await driverPortal.proofOfDeliveryButton.click();
      await driverPortal.capturePhotoButton.click();
      await driverPortal.uploadPhotoButton.click();

      // Collect signature
      await driverPortal.collectSignatureButton.click();
      await driverPortal.customerNameInput.fill('Jane Smith');
      await driverPortal.drawSignature('Jane Smith');
      await driverPortal.saveSignatureButton.click();

      // Complete delivery
      await driverPortal.completeDeliveryButton.click();
      await expect(driverPortal.deliveryCompletedMessage).toBeVisible();
      await expect(driverPortal.deliveryStatus).toContainText('Delivered');

      // Verify delivery appears in completed list
      await driverPortal.completedTab.click();
      await expect(driverPortal.completedDeliveries).toContainText(
        TestData.packages.testPackage.trackingNumber
      );
    });

    test('should handle failed delivery attempts @workflow', async () => {
      await driverPortal.deliveriesTab.click();
      await driverPortal.deliveryItems.first().click();
      await driverPortal.startDeliveryButton.click();

      // Attempt delivery failure
      await driverPortal.reportIssueButton.click();
      await expect(driverPortal.issueReportForm).toBeVisible();

      // Select failure reason
      await driverPortal.failureReasonSelect.selectOption('Customer not available');
      await driverPortal.issueNotesTextarea.fill('No answer at door, attempted multiple times');
      await driverPortal.addFailurePhotoButton.click();

      // Capture proof of attempt
      await driverPortal.capturePhotoButton.click();
      await driverPortal.uploadPhotoButton.click();

      // Submit failed delivery
      await driverPortal.submitFailedDeliveryButton.click();
      await expect(driverPortal.failedDeliveryMessage).toBeVisible();

      // Verify status update
      await expect(driverPortal.deliveryStatus).toContainText('Failed - Customer not available');
    });

    test('should manage delivery manifest @workflow', async () => {
      // View daily manifest
      await driverPortal.manifestTab.click();
      await expect(driverPortal.dailyManifest).toBeVisible();

      // Check manifest details
      await expect(driverPortal.manifestDate).toBeVisible();
      await expect(driverPortal.totalPackages).toContainText(/\d+/);
      await expect(driverPortal.routeInfo).toBeVisible();

      // Test manifest filtering
      await driverPortal.filterPendingButton.click();
      await expect(driverPortal.manifestList.locator('.pending')).toBeVisible();

      await driverPortal.filterCompletedButton.click();
      await expect(driverPortal.manifestList.locator('.completed')).toBeVisible();

      // Test manifest export
      await driverPortal.exportManifestButton.click();
      await expect(driverPortal.exportSuccessMessage).toBeVisible();
    });

    test('should sync delivery data offline @workflow @performance', async ({ page }) => {
      // Simulate offline condition
      await page.setOffline(true);

      // Attempt delivery operations
      await driverPortal.scanPackageButton.click();
      await driverPortal.simulateQRScan('OFFLINE_TEST_001');

      // Should queue operations for sync
      await expect(driverPortal.offlineIndicator).toBeVisible();
      await expect(driverPortal.queuedOperations).toContainText('1 operation queued');

      // Return online
      await page.setOffline(false);

      // Should auto-sync
      await expect(driverPortal.syncingIndicator).toBeVisible();
      await expect(driverPortal.syncCompleteMessage).toBeVisible({ timeout: 10000 });
      await expect(driverPortal.queuedOperations).toContainText('0 operations');
    });
  });

  test.describe('Mobile Optimization', () => {
    test('should adapt to mobile viewport @mobile', async ({ page }) => {
      // Test different mobile sizes
      const mobileViewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone XR' },
        { width: 360, height: 640, name: 'Galaxy S5' },
      ];

      for (const viewport of mobileViewports) {
        await page.setViewportSize(viewport);

        // Verify responsive design
        await expect(driverPortal.mobileHeader).toBeVisible();
        await expect(driverPortal.bottomNavigation).toBeVisible();
        await expect(driverPortal.quickActionButtons).toBeVisible();

        // Test touch-friendly interface
        await assertions.checkTouchTargetSizes(page);
        await assertions.checkMobileNavigation(page);
      }
    });

    test('should handle touch gestures @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Test swipe navigation
      await assertions.testSwipeGestures(page);

      // Test pinch zoom on maps
      await driverPortal.viewRouteButton.click();
      await assertions.testPinchZoom(page, driverPortal.mapContainer);

      // Test long press actions
      await driverPortal.deliveryItems.first().tap();
      await expect(driverPortal.contextMenu).toBeVisible();
    });

    test('should optimize for mobile performance @mobile @performance', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Measure mobile performance
      const performanceMetrics = await page.evaluate(
        () => performance.getEntriesByType('navigation')[0]
      );
      const loadTime = performanceMetrics.loadEventEnd - performanceMetrics.loadEventStart;

      expect(loadTime).toBeLessThan(3000); // 3 second mobile target

      // Test lazy loading
      await assertions.testLazyLoading(page);

      // Test touch response times
      await assertions.checkTouchResponseTime(page);
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network connectivity issues @error-handling', async ({ page }) => {
      // Simulate network failure
      await page.setOffline(true);

      // Attempt operations
      await driverPortal.scanPackageButton.click();
      await expect(driverPortal.offlineMessage).toContainText(/offline|no connection/i);
      await expect(driverPortal.retryButton).toBeVisible();

      // Restore connection
      await page.setOffline(false);
      await driverPortal.retryButton.click();

      await expect(driverPortal.connectionRestoredMessage).toBeVisible();
      await expect(driverPortal.scanPackageButton).toBeEnabled();
    });

    test('should recover from camera errors @error-handling', async ({ page, context }) => {
      // Deny camera permissions
      await context.grantPermissions([]);

      await driverPortal.scanPackageButton.click();
      await expect(driverPortal.cameraError).toContainText(/camera.*denied|permission/i);
      await expect(driverPortal.enableCameraButton).toBeVisible();
      await expect(driverPortal.manualEntryButton).toBeVisible();

      // Test fallback to manual entry
      await driverPortal.manualEntryButton.click();
      await expect(driverPortal.manualEntryForm).toBeVisible();
    });

    test('should handle GPS service failures @error-handling', async ({ page, context }) => {
      await context.grantPermissions([]);

      await driverPortal.enableLocationButton.click();
      await expect(driverPortal.gpsError).toContainText(/location.*denied|GPS/i);
      await expect(driverPortal.manualLocationButton).toBeVisible();

      // Test manual location as fallback
      await driverPortal.manualLocationButton.click();
      await driverPortal.addressInput.fill('123 Test Street');
      await driverPortal.confirmLocationButton.click();

      await expect(driverPortal.manualLocationSet).toBeVisible();
    });

    test('should maintain data integrity during errors @error-handling', async ({ page }) => {
      // Start operations and simulate errors
      await driverPortal.scanPackageButton.click();
      await driverPortal.simulateQRScan('TEST_RECOVERY_001');

      // Simulate app crash/reload
      await page.reload();

      // Verify data recovery
      await authHelpers.quickLogin('driver');
      await driverPortal.scansTab.click();

      // Should maintain scan history
      await expect(driverPortal.scanHistory).toContainText('TEST_RECOVERY_001');
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should meet performance benchmarks @performance', async ({ page }) => {
      const startTime = Date.now();

      // Test critical user journey
      await driverPortal.scanPackageButton.click();
      await driverPortal.simulateQRScan(TestData.packages.testPackage.trackingNumber);
      await driverPortal.startDeliveryButton.click();

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);

      await assertions.checkPerformanceMetrics(5000);
    });

    test('should optimize for low-end devices @performance', async ({ page }) => {
      // Simulate slow device performance
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 500 * 1024, // 500kb/s
        uploadThroughput: 500 * 1024,
        latency: 100,
      });

      await assertions.checkPerformanceMetrics(8000); // Longer timeout for slow conditions

      // Test essential functionality still works
      await driverPortal.scanPackageButton.click();
      await expect(driverPortal.cameraView).toBeVisible({ timeout: 10000 });
    });
  });
});
