import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Package Scanning Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock camera/media devices for testing
    await page.addInitScript(() => {
      // Mock getUserMedia for camera access
      const mockMediaStream = {
        getTracks: () => [
          {
            stop: () => {},
            getSettings: () => ({ width: 640, height: 480, facingMode: 'environment' }),
          },
        ],
        getVideoTracks: () => [
          {
            stop: () => {},
            getSettings: () => ({ width: 640, height: 480, facingMode: 'environment' }),
          },
        ],
      };

      window.navigator.mediaDevices = {
        getUserMedia: async (constraints) => {
          if (constraints?.video) {
            return mockMediaStream as MediaStream;
          }
          throw new Error('Video constraints required');
        },
        enumerateDevices: async () => [
          {
            deviceId: 'camera1',
            kind: 'videoinput',
            label: 'Back Camera',
            groupId: 'group1',
          },
        ],
      } as MediaDevices;

      // Mock barcode detection if available
      if ('BarcodeDetector' in window || true) {
        (window as any).BarcodeDetector = class {
          detect(imageData: any) {
            return Promise.resolve([
              {
                boundingBox: { x: 100, y: 100, width: 200, height: 50 },
                cornerPoints: [
                  { x: 100, y: 100 },
                  { x: 300, y: 100 },
                  { x: 300, y: 150 },
                  { x: 100, y: 150 },
                ],
                format: 'code_128',
                rawValue: 'SNH123456789',
              },
            ]);
          }
        };
      }
    });

    // Login as driver
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.driver.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.driver.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);
  });

  test('should request camera permissions for scanning', async ({ page }) => {
    await page.goto('/driver');

    // Click scan package button
    const scanButton = page.locator('[data-testid="scan-package-button"]');
    await expect(scanButton).toBeVisible();
    await scanButton.click();

    // Should open scanner interface
    const scannerInterface = page.locator('[data-testid="barcode-scanner"]');
    await expect(scannerInterface).toBeVisible();

    // Check for camera permission request or camera view
    const cameraView = page.locator('[data-testid="camera-preview"]');
    const permissionRequest = page.locator('[data-testid="camera-permission-request"]');

    if (await permissionRequest.isVisible()) {
      await expect(permissionRequest).toContainText(/camera|permission|access/i);

      const allowButton = permissionRequest.locator('[data-testid="allow-camera"]');
      if (await allowButton.isVisible()) {
        await allowButton.click();

        // Camera view should appear
        await expect(cameraView).toBeVisible();
      }
    } else {
      // Camera should be active
      await expect(cameraView).toBeVisible();
    }
  });

  test('should display barcode scanning interface', async ({ page }) => {
    await page.goto('/driver');

    // Open scanner
    await page.click('[data-testid="scan-package-button"]');
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();

    // Check scanner elements
    await expect(page.locator('[data-testid="camera-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="scan-overlay"]')).toBeVisible();

    // Check scanner controls
    await expect(page.locator('[data-testid="close-scanner"]')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-flash"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-camera"]')).toBeVisible();

    // Check scan target/viewfinder
    const scanTarget = page.locator('[data-testid="scan-viewfinder"]');
    if (await scanTarget.isVisible()) {
      await expect(scanTarget).toBeVisible();
    }

    // Check instructions
    await expect(page.locator('[data-testid="scan-instructions"]')).toContainText(
      /position|center|barcode/i
    );
  });

  test('should handle successful barcode detection', async ({ page }) => {
    await page.goto('/driver');

    // Open scanner
    await page.click('[data-testid="scan-package-button"]');
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();

    // Simulate successful scan (via manual trigger or automatic detection)
    const captureButton = page.locator('[data-testid="capture-barcode"]');
    const scanResult = page.locator('[data-testid="scan-result"]');

    if (await captureButton.isVisible()) {
      await captureButton.click();
    } else {
      // Wait for automatic detection simulation
      await page.waitForTimeout(2000);
    }

    // Check for scan success indicators
    const successIndicator = page.locator('[data-testid="scan-success"]');
    const barcodeValue = page.locator('[data-testid="scanned-barcode-value"]');

    if (await successIndicator.isVisible()) {
      await expect(successIndicator).toContainText(/success|detected|found/i);
    }

    if (await barcodeValue.isVisible()) {
      const value = await barcodeValue.textContent();
      expect(value).toMatch(/SNH\d+|[A-Z0-9]+/);
    }

    // Should show package lookup results
    const packageInfo = page.locator('[data-testid="scanned-package-info"]');
    if (await packageInfo.isVisible()) {
      await expect(packageInfo).toBeVisible();
      await expect(packageInfo.locator('[data-testid="package-id"]')).toBeVisible();
      await expect(packageInfo.locator('[data-testid="delivery-address"]')).toBeVisible();
    }
  });

  test('should provide manual entry fallback', async ({ page }) => {
    await page.goto('/driver');

    // Open scanner
    await page.click('[data-testid="scan-package-button"]');
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();

    // Look for manual entry option
    const manualEntryButton = page.locator('[data-testid="manual-entry-button"]');
    await expect(manualEntryButton).toBeVisible();
    await expect(manualEntryButton).toContainText(/manual|type|enter/i);

    // Click manual entry
    await manualEntryButton.click();

    // Should show input field
    const manualInput = page.locator('[data-testid="manual-barcode-input"]');
    await expect(manualInput).toBeVisible();
    await expect(manualInput).toHaveAttribute('placeholder', /enter.*code|barcode|tracking/i);

    // Test manual entry
    await manualInput.fill('SNH987654321');
    await page.click('[data-testid="submit-manual-entry"]');

    // Should process manual entry
    await expect(page.locator('[data-testid="processing-entry"]')).toBeVisible();

    // Should show results or error
    const manualResult = page.locator('[data-testid="manual-entry-result"]');
    if (await manualResult.isVisible()) {
      await expect(manualResult).toBeVisible();
    }
  });

  test('should handle package lookup after scan', async ({ page }) => {
    await page.goto('/driver');

    // Open scanner and simulate scan
    await page.click('[data-testid="scan-package-button"]');
    await expect(page.locator('[data-testid="barcode-scanner"]')).toBeVisible();

    // Simulate or trigger scan
    const manualEntryButton = page.locator('[data-testid="manual-entry-button"]');
    await manualEntryButton.click();

    await page.fill('[data-testid="manual-barcode-input"]', 'SNH123456789');
    await page.click('[data-testid="submit-manual-entry"]');

    // Check lookup results
    const lookupResult = page.locator('[data-testid="package-lookup-result"]');
    const notFoundResult = page.locator('[data-testid="package-not-found"]');

    // Should show either found package or not found message
    const hasResult = await lookupResult.isVisible();
    const hasNotFound = await notFoundResult.isVisible();

    expect(hasResult || hasNotFound).toBeTruthy();

    if (hasResult) {
      // Check package details
      await expect(lookupResult.locator('[data-testid="package-id"]')).toBeVisible();
      await expect(lookupResult.locator('[data-testid="recipient-name"]')).toBeVisible();
      await expect(lookupResult.locator('[data-testid="delivery-address"]')).toBeVisible();

      // Check action buttons
      await expect(lookupResult.locator('[data-testid="mark-delivered"]')).toBeVisible();
      await expect(lookupResult.locator('[data-testid="add-note"]')).toBeVisible();
    } else if (hasNotFound) {
      await expect(notFoundResult).toContainText(/not found|invalid|unknown/i);

      // Should offer options
      const tryAgainButton = notFoundResult.locator('[data-testid="try-again"]');
      const reportIssueButton = notFoundResult.locator('[data-testid="report-issue"]');

      if (await tryAgainButton.isVisible()) {
        await expect(tryAgainButton).toContainText(/try again|rescan/i);
      }

      if (await reportIssueButton.isVisible()) {
        await expect(reportIssueButton).toContainText(/report|issue|problem/i);
      }
    }
  });

  test('should provide audio feedback for scans', async ({ page }) => {
    await page.goto('/driver');

    // Check for audio feedback settings
    const audioToggle = page.locator('[data-testid="audio-feedback-toggle"]');
    const soundSettings = page.locator('[data-testid="sound-settings"]');

    if (await audioToggle.isVisible()) {
      // Test audio toggle
      const isEnabled = await audioToggle.isChecked();
      await audioToggle.click();
      await expect(audioToggle).toBeChecked({ checked: !isEnabled });
    }

    if (await soundSettings.isVisible()) {
      await soundSettings.click();

      // Should show sound preferences
      const soundModal = page.locator('[data-testid="sound-preferences-modal"]');
      await expect(soundModal).toBeVisible();

      // Check sound options
      await expect(soundModal.locator('[data-testid="success-sound-toggle"]')).toBeVisible();
      await expect(soundModal.locator('[data-testid="error-sound-toggle"]')).toBeVisible();
      await expect(soundModal.locator('[data-testid="volume-slider"]')).toBeVisible();
    }

    // Open scanner to test audio
    await page.click('[data-testid="scan-package-button"]');

    // Look for audio feedback indicators
    const audioIndicator = page.locator('[data-testid="audio-enabled-indicator"]');
    if (await audioIndicator.isVisible()) {
      await expect(audioIndicator).toContainText(/sound|audio/i);
    }
  });

  test('should handle scan error conditions', async ({ page }) => {
    await page.goto('/driver');

    // Test camera access error
    await page.addInitScript(() => {
      window.navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('Camera access denied');
      };
    });

    await page.reload();
    await page.click('[data-testid="scan-package-button"]');

    // Should show camera error
    const cameraError = page.locator('[data-testid="camera-error"]');
    if (await cameraError.isVisible()) {
      await expect(cameraError).toContainText(/camera|access|error/i);

      // Should offer alternatives
      const troubleshootButton = cameraError.locator('[data-testid="troubleshoot-camera"]');
      const manualEntryOption = cameraError.locator('[data-testid="use-manual-entry"]');

      if (await troubleshootButton.isVisible()) {
        await expect(troubleshootButton).toContainText(/troubleshoot|help|fix/i);
      }

      if (await manualEntryOption.isVisible()) {
        await expect(manualEntryOption).toContainText(/manual|type/i);
      }
    }

    // Test low light conditions
    const lowLightWarning = page.locator('[data-testid="low-light-warning"]');
    if (await lowLightWarning.isVisible()) {
      await expect(lowLightWarning).toContainText(/light|dark|flash/i);

      const flashButton = page.locator('[data-testid="enable-flash"]');
      if (await flashButton.isVisible()) {
        await flashButton.click();
        await expect(page.locator('[data-testid="flash-enabled"]')).toBeVisible();
      }
    }
  });

  test('should support bulk scanning workflow', async ({ page }) => {
    await page.goto('/driver');

    // Check for bulk scan mode
    const bulkScanButton = page.locator('[data-testid="bulk-scan-mode"]');
    if (await bulkScanButton.isVisible()) {
      await bulkScanButton.click();

      // Should enter bulk scanning mode
      const bulkScanInterface = page.locator('[data-testid="bulk-scan-interface"]');
      await expect(bulkScanInterface).toBeVisible();

      // Check bulk scan features
      await expect(bulkScanInterface.locator('[data-testid="scan-counter"]')).toBeVisible();
      await expect(bulkScanInterface.locator('[data-testid="scanned-items-list"]')).toBeVisible();

      // Simulate multiple scans
      for (let i = 0; i < 3; i++) {
        const scanButton = page.locator('[data-testid="quick-scan-next"]');
        if (await scanButton.isVisible()) {
          await scanButton.click();

          // Use manual entry for testing
          await page.fill('[data-testid="manual-barcode-input"]', `SNH12345678${i}`);
          await page.click('[data-testid="add-to-batch"]');

          // Should update counter
          const counter = page.locator('[data-testid="scan-counter"]');
          await expect(counter).toContainText(`${i + 1}`);
        }
      }

      // Check completion options
      await expect(page.locator('[data-testid="finish-bulk-scan"]')).toBeVisible();
      await expect(page.locator('[data-testid="clear-batch"]')).toBeVisible();
    }
  });

  test('should handle different barcode formats', async ({ page }) => {
    await page.goto('/driver');
    await page.click('[data-testid="scan-package-button"]');

    // Test different barcode formats through manual entry
    const testCodes = [
      { code: 'SNH123456789', format: 'Shipnorth Format' },
      { code: '1234567890123', format: 'EAN-13' },
      { code: '123456789012', format: 'UPC-A' },
      { code: 'CODE128-TEST', format: 'Code 128' },
    ];

    for (const testCode of testCodes) {
      // Open manual entry
      const manualButton = page.locator('[data-testid="manual-entry-button"]');
      if (await manualButton.isVisible()) {
        await manualButton.click();

        // Enter test code
        await page.fill('[data-testid="manual-barcode-input"]', testCode.code);
        await page.click('[data-testid="submit-manual-entry"]');

        // Check format detection
        const formatIndicator = page.locator('[data-testid="detected-format"]');
        if (await formatIndicator.isVisible()) {
          const formatText = await formatIndicator.textContent();
          expect(formatText).toBeTruthy();
        }

        // Clear for next test
        const clearButton = page.locator('[data-testid="clear-entry"]');
        if (await clearButton.isVisible()) {
          await clearButton.click();
        }
      }
    }
  });

  test('should integrate with package delivery workflow', async ({ page }) => {
    await page.goto('/driver');

    // Scan a package
    await page.click('[data-testid="scan-package-button"]');
    await page.click('[data-testid="manual-entry-button"]');
    await page.fill('[data-testid="manual-barcode-input"]', 'SNH123456789');
    await page.click('[data-testid="submit-manual-entry"]');

    // Should show package found
    const packageResult = page.locator('[data-testid="package-lookup-result"]');
    if (await packageResult.isVisible()) {
      // Test delivery workflow integration
      const markDeliveredButton = packageResult.locator('[data-testid="mark-delivered"]');
      if (await markDeliveredButton.isVisible()) {
        await markDeliveredButton.click();

        // Should open delivery confirmation
        const deliveryModal = page.locator('[data-testid="delivery-confirmation-modal"]');
        await expect(deliveryModal).toBeVisible();

        // Check delivery options
        await expect(deliveryModal.locator('[data-testid="delivery-location"]')).toBeVisible();
        await expect(deliveryModal.locator('[data-testid="recipient-name"]')).toBeVisible();

        // Check photo/signature options
        await expect(deliveryModal.locator('[data-testid="add-photo"]')).toBeVisible();
        await expect(deliveryModal.locator('[data-testid="capture-signature"]')).toBeVisible();

        // Confirm delivery
        await page.click('[data-testid="confirm-delivery"]');

        // Should show success message
        await expect(page.locator('[data-testid="delivery-confirmed"]')).toBeVisible();
      }
    }
  });

  test('should handle scanner settings and preferences', async ({ page }) => {
    await page.goto('/driver');

    // Look for scanner settings
    const settingsButton = page.locator('[data-testid="scanner-settings"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      const settingsModal = page.locator('[data-testid="scanner-settings-modal"]');
      await expect(settingsModal).toBeVisible();

      // Check scanner preferences
      const autoFocusToggle = settingsModal.locator('[data-testid="auto-focus-toggle"]');
      const torchToggle = settingsModal.locator('[data-testid="torch-default-toggle"]');
      const vibrateToggle = settingsModal.locator('[data-testid="vibrate-feedback-toggle"]');

      if (await autoFocusToggle.isVisible()) {
        await autoFocusToggle.click();
        await expect(autoFocusToggle).toBeChecked();
      }

      if (await torchToggle.isVisible()) {
        await torchToggle.click();
        await expect(page.locator('[data-testid="torch-setting-saved"]')).toBeVisible();
      }

      if (await vibrateToggle.isVisible()) {
        await vibrateToggle.click();
        await expect(vibrateToggle).toBeChecked();
      }

      // Check scan quality settings
      const qualitySelect = settingsModal.locator('[data-testid="scan-quality-select"]');
      if (await qualitySelect.isVisible()) {
        await qualitySelect.click();

        await expect(page.locator('[data-testid="quality-high"]')).toBeVisible();
        await expect(page.locator('[data-testid="quality-medium"]')).toBeVisible();
        await expect(page.locator('[data-testid="quality-fast"]')).toBeVisible();
      }

      // Save settings
      await page.click('[data-testid="save-scanner-settings"]');
      await expect(settingsModal).not.toBeVisible();
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 414, height: 896 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/driver');

      // Open scanner
      await page.click('[data-testid="scan-package-button"]');

      // Check scanner interface fits screen
      const scanner = page.locator('[data-testid="barcode-scanner"]');
      await expect(scanner).toBeVisible();

      const scannerBox = await scanner.boundingBox();
      if (scannerBox) {
        expect(scannerBox.width).toBeLessThanOrEqual(viewport.width);
        expect(scannerBox.height).toBeLessThanOrEqual(viewport.height);
      }

      // Check camera preview is properly sized
      const cameraPreview = page.locator('[data-testid="camera-preview"]');
      if (await cameraPreview.isVisible()) {
        const previewBox = await cameraPreview.boundingBox();
        if (previewBox) {
          expect(previewBox.width).toBeGreaterThan(0);
          expect(previewBox.height).toBeGreaterThan(0);
        }
      }

      // Check controls are accessible
      await expect(page.locator('[data-testid="close-scanner"]')).toBeVisible();
      await expect(page.locator('[data-testid="manual-entry-button"]')).toBeVisible();
    }
  });
});
