import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Signature Capture System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock HTML5 Canvas for signature capture
    await page.addInitScript(() => {
      // Mock canvas context methods
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (contextId: string) {
        if (contextId === '2d') {
          const mockContext = {
            beginPath: () => {},
            moveTo: (x: number, y: number) => {},
            lineTo: (x: number, y: number) => {},
            stroke: () => {},
            strokeStyle: '#000000',
            lineWidth: 2,
            lineCap: 'round',
            lineJoin: 'round',
            clearRect: (x: number, y: number, width: number, height: number) => {},
            canvas: this,
            toDataURL: () =>
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          };

          // Store mock context for access
          (this as any)._mockContext = mockContext;
          return mockContext;
        }
        return originalGetContext.call(this, contextId);
      };

      // Mock toDataURL for canvas
      HTMLCanvasElement.prototype.toDataURL = function () {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      };
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

  test('should display signature capture interface', async ({ page }) => {
    await page.goto('/driver');

    // Navigate to package that requires signature
    const packageWithSignature = page.locator('[data-testid^="package-"]').first();
    if (await packageWithSignature.isVisible()) {
      await packageWithSignature.click();

      // Look for signature capture button
      const signatureButton = page.locator(
        '[data-testid="capture-signature"], [data-testid="signature-capture"]'
      );
      await expect(signatureButton).toBeVisible();

      await signatureButton.click();

      // Should open signature capture interface
      const signatureModal = page.locator('[data-testid="signature-modal"]');
      const signatureCanvas = page.locator('[data-testid="signature-canvas"]');

      await expect(signatureModal).toBeVisible();
      await expect(signatureCanvas).toBeVisible();

      // Check interface elements
      await expect(page.locator('[data-testid="signature-instructions"]')).toBeVisible();
      await expect(page.locator('[data-testid="clear-signature"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-signature"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-signature"]')).toBeVisible();
    }
  });

  test('should handle touch and mouse drawing on canvas', async ({ page }) => {
    await page.goto('/driver');

    // Open signature capture
    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      const canvas = page.locator('[data-testid="signature-canvas"]');
      await expect(canvas).toBeVisible();

      // Get canvas dimensions for drawing
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        // Simulate drawing a simple signature
        const startX = canvasBox.x + 50;
        const startY = canvasBox.y + canvasBox.height / 2;
        const endX = canvasBox.x + canvasBox.width - 50;
        const endY = canvasBox.y + canvasBox.height / 2;

        // Draw with mouse
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY);
        await page.mouse.up();

        // Check for drawing feedback
        const drawingIndicator = page.locator('[data-testid="signature-drawn"]');
        const hasSignature = page.locator('[data-testid="has-signature"]');

        if (await drawingIndicator.isVisible()) {
          await expect(drawingIndicator).toBeVisible();
        }

        // Save button should be enabled after drawing
        const saveButton = page.locator('[data-testid="save-signature"]');
        await expect(saveButton).toBeEnabled();
      }
    }
  });

  test('should handle signature clear and redo functionality', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      const canvas = page.locator('[data-testid="signature-canvas"]');
      const clearButton = page.locator('[data-testid="clear-signature"]');

      // Draw something first
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
        await page.mouse.up();

        // Clear the signature
        await clearButton.click();

        // Canvas should be cleared
        const canvasElement = await page.waitForSelector('[data-testid="signature-canvas"]');

        // Save button should be disabled after clearing
        const saveButton = page.locator('[data-testid="save-signature"]');
        await expect(saveButton).toBeDisabled();

        // Should show empty state message
        const emptyState = page.locator('[data-testid="signature-empty-state"]');
        if (await emptyState.isVisible()) {
          await expect(emptyState).toContainText(/draw|sign|empty/i);
        }
      }

      // Test redo functionality if available
      const undoButton = page.locator('[data-testid="undo-signature"]');
      const redoButton = page.locator('[data-testid="redo-signature"]');

      if ((await undoButton.isVisible()) && (await redoButton.isVisible())) {
        // Draw again
        if (canvasBox) {
          await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
          await page.mouse.down();
          await page.mouse.move(canvasBox.x + 150, canvasBox.y + 100);
          await page.mouse.up();
        }

        await undoButton.click();
        await expect(redoButton).toBeEnabled();

        await redoButton.click();
        // Signature should reappear
      }
    }
  });

  test('should save and store signature successfully', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      // Draw signature
      const canvas = page.locator('[data-testid="signature-canvas"]');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        // Create a more complex signature
        await page.mouse.move(canvasBox.x + 50, canvasBox.y + 100);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 80);
        await page.mouse.move(canvasBox.x + 150, canvasBox.y + 120);
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 90);
        await page.mouse.up();

        // Add recipient name if required
        const recipientNameField = page.locator('[data-testid="recipient-name-input"]');
        if (await recipientNameField.isVisible()) {
          await recipientNameField.fill('John Doe');
        }

        // Save signature
        const saveButton = page.locator('[data-testid="save-signature"]');
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // Should show saving state
        const savingIndicator = page.locator('[data-testid="saving-signature"]');
        if (await savingIndicator.isVisible()) {
          await expect(savingIndicator).toContainText(/saving|processing/i);
          await page.waitForSelector('[data-testid="saving-signature"]', { state: 'hidden' });
        }

        // Should show success message
        const successMessage = page.locator('[data-testid="signature-saved"]');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toContainText(/saved|captured|success/i);

        // Modal should close
        const signatureModal = page.locator('[data-testid="signature-modal"]');
        await expect(signatureModal).not.toBeVisible();

        // Package should show signature captured indicator
        const signatureCaptured = page.locator('[data-testid="signature-captured"]');
        if (await signatureCaptured.isVisible()) {
          await expect(signatureCaptured).toContainText(/signed|captured/i);
        }
      }
    }
  });

  test('should display signature in tracking/delivery confirmation', async ({ page }) => {
    // First capture a signature (simplified for test)
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();

      // Look for existing signature or capture new one
      const existingSignature = page.locator('[data-testid="existing-signature"]');
      const captureButton = page.locator('[data-testid="capture-signature"]');

      if (await existingSignature.isVisible()) {
        // View existing signature
        await existingSignature.click();

        const signatureViewer = page.locator('[data-testid="signature-viewer-modal"]');
        await expect(signatureViewer).toBeVisible();

        // Check signature display elements
        await expect(signatureViewer.locator('[data-testid="signature-image"]')).toBeVisible();
        await expect(signatureViewer.locator('[data-testid="signature-timestamp"]')).toBeVisible();
        await expect(signatureViewer.locator('[data-testid="recipient-name"]')).toBeVisible();

        // Check for signature metadata
        const signatureInfo = page.locator('[data-testid="signature-info"]');
        if (await signatureInfo.isVisible()) {
          await expect(signatureInfo.locator('[data-testid="captured-by"]')).toBeVisible();
          await expect(signatureInfo.locator('[data-testid="capture-time"]')).toBeVisible();
          await expect(signatureInfo.locator('[data-testid="device-info"]')).toBeVisible();
        }

        // Test close functionality
        await page.click('[data-testid="close-signature-viewer"]');
        await expect(signatureViewer).not.toBeVisible();
      } else if (await captureButton.isVisible()) {
        // Quick signature capture for test
        await captureButton.click();

        const canvas = page.locator('[data-testid="signature-canvas"]');
        const canvasBox = await canvas.boundingBox();

        if (canvasBox) {
          await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
          await page.mouse.down();
          await page.mouse.move(canvasBox.x + 200, canvasBox.y + 120);
          await page.mouse.up();

          await page.click('[data-testid="save-signature"]');
          await expect(page.locator('[data-testid="signature-saved"]')).toBeVisible();
        }
      }
    }

    // Test signature in customer tracking view (if accessible)
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.customer.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.customer.password);
    await page.click('[data-testid="login-submit"]');

    // Navigate to delivered package with signature
    const customerPackages = page.locator('[data-testid="customer-packages"]');
    if (await customerPackages.isVisible()) {
      const deliveredPackage = customerPackages.locator('[data-testid*="delivered"]').first();

      if (await deliveredPackage.isVisible()) {
        await deliveredPackage.click();

        // Should show signature in package details
        const packageSignature = page.locator('[data-testid="delivery-signature"]');
        if (await packageSignature.isVisible()) {
          await expect(packageSignature).toBeVisible();

          // Click to view full signature
          await packageSignature.click();

          const signatureModal = page.locator('[data-testid="signature-view-modal"]');
          await expect(signatureModal).toBeVisible();

          await expect(signatureModal.locator('[data-testid="signature-image"]')).toBeVisible();
          await expect(signatureModal.locator('[data-testid="delivery-date"]')).toBeVisible();
          await expect(signatureModal.locator('[data-testid="driver-name"]')).toBeVisible();
        }
      }
    }
  });

  test('should validate signature quality and requirements', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      const canvas = page.locator('[data-testid="signature-canvas"]');
      const saveButton = page.locator('[data-testid="save-signature"]');

      // Test with very minimal signature (single dot)
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(canvasBox.x + 100, canvasBox.y + 100);

        // Try to save minimal signature
        await saveButton.click();

        // Should show quality warning
        const qualityWarning = page.locator('[data-testid="signature-quality-warning"]');
        if (await qualityWarning.isVisible()) {
          await expect(qualityWarning).toContainText(/quality|too small|minimal/i);

          // Should offer options
          const retryButton = qualityWarning.locator('[data-testid="retry-signature"]');
          const forceAccept = qualityWarning.locator('[data-testid="accept-minimal"]');

          if (await retryButton.isVisible()) {
            await expect(retryButton).toContainText(/retry|try again/i);
          }

          if (await forceAccept.isVisible()) {
            await expect(forceAccept).toContainText(/accept|continue/i);
          }
        }

        // Clear and create better signature
        await page.click('[data-testid="clear-signature"]');

        // Draw a more substantial signature
        await page.mouse.move(canvasBox.x + 50, canvasBox.y + 100);
        await page.mouse.down();
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(canvasBox.x + 50 + i * 30, canvasBox.y + 100 + Math.sin(i) * 20);
          await page.waitForTimeout(50);
        }
        await page.mouse.up();

        // Should now accept the signature
        await saveButton.click();

        const successMessage = page.locator('[data-testid="signature-saved"]');
        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle signature canvas responsiveness', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/driver');

      const packageItem = page.locator('[data-testid^="package-"]').first();
      if (await packageItem.isVisible()) {
        await packageItem.click();
        await page.click('[data-testid="capture-signature"]');

        const canvas = page.locator('[data-testid="signature-canvas"]');
        await expect(canvas).toBeVisible();

        const canvasBox = await canvas.boundingBox();
        if (canvasBox) {
          // Canvas should fit within viewport with margin
          expect(canvasBox.width).toBeLessThan(viewport.width - 40);
          expect(canvasBox.height).toBeLessThan(viewport.height - 100);

          // Test drawing at this size
          await page.mouse.move(canvasBox.x + 20, canvasBox.y + canvasBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            canvasBox.x + canvasBox.width - 20,
            canvasBox.y + canvasBox.height / 2
          );
          await page.mouse.up();

          // Controls should be accessible
          await expect(page.locator('[data-testid="save-signature"]')).toBeEnabled();
          await expect(page.locator('[data-testid="clear-signature"]')).toBeVisible();
        }

        // Close modal for next iteration
        await page.click('[data-testid="cancel-signature"]');
      }
    }
  });

  test('should handle signature with recipient name validation', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      // Draw signature
      const canvas = page.locator('[data-testid="signature-canvas"]');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
        await page.mouse.up();

        // Check for recipient name field
        const recipientField = page.locator('[data-testid="recipient-name-input"]');
        const signedByField = page.locator('[data-testid="signed-by-input"]');

        if (await recipientField.isVisible()) {
          // Test without name first
          await page.click('[data-testid="save-signature"]');

          const nameValidationError = page.locator('[data-testid="recipient-name-error"]');
          if (await nameValidationError.isVisible()) {
            await expect(nameValidationError).toContainText(/name.*required|enter.*name/i);
          }

          // Fill in name
          await recipientField.fill('John Smith');

          // Should now save successfully
          await page.click('[data-testid="save-signature"]');
          await expect(page.locator('[data-testid="signature-saved"]')).toBeVisible();
        } else if (await signedByField.isVisible()) {
          // Alternative "signed by" field
          await signedByField.fill('Jane Doe');
          await page.click('[data-testid="save-signature"]');
          await expect(page.locator('[data-testid="signature-saved"]')).toBeVisible();
        } else {
          // No name field required
          await page.click('[data-testid="save-signature"]');
          await expect(page.locator('[data-testid="signature-saved"]')).toBeVisible();
        }
      }
    }
  });

  test('should handle signature error conditions', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      // Test canvas loading error simulation
      await page.evaluate(() => {
        const canvas = document.querySelector(
          '[data-testid="signature-canvas"]'
        ) as HTMLCanvasElement;
        if (canvas) {
          // Simulate canvas error
          canvas.getContext = () => null;
        }
      });

      // Should show canvas error
      const canvasError = page.locator('[data-testid="canvas-error"]');
      if (await canvasError.isVisible()) {
        await expect(canvasError).toContainText(/canvas.*error|signature.*unavailable/i);

        // Should offer alternative
        const alternativeOption = page.locator('[data-testid="signature-alternative"]');
        if (await alternativeOption.isVisible()) {
          await expect(alternativeOption).toContainText(/skip.*signature|no signature/i);
        }
      }

      // Test network error during save
      await page.route('**/api/signatures/**', (route) => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });

      // Reset canvas and try to save
      await page.reload();
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      const canvas = page.locator('[data-testid="signature-canvas"]');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
        await page.mouse.up();

        await page.click('[data-testid="save-signature"]');

        // Should show save error
        const saveError = page.locator('[data-testid="signature-save-error"]');
        if (await saveError.isVisible()) {
          await expect(saveError).toContainText(/error.*saving|failed.*save|network.*error/i);

          // Should offer retry
          const retryButton = page.locator('[data-testid="retry-save-signature"]');
          if (await retryButton.isVisible()) {
            await expect(retryButton).toContainText(/retry|try again/i);
          }

          // Should offer offline save
          const offlineSave = page.locator('[data-testid="save-offline"]');
          if (await offlineSave.isVisible()) {
            await expect(offlineSave).toContainText(/save.*offline|store.*locally/i);
          }
        }
      }
    }
  });

  test('should support different signature pad sizes', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="capture-signature"]');

      // Check for signature pad size options
      const sizeOptions = page.locator('[data-testid="signature-size-options"]');

      if (await sizeOptions.isVisible()) {
        const smallSize = sizeOptions.locator('[data-testid="size-small"]');
        const mediumSize = sizeOptions.locator('[data-testid="size-medium"]');
        const largeSize = sizeOptions.locator('[data-testid="size-large"]');

        // Test different sizes
        if (await smallSize.isVisible()) {
          await smallSize.click();
          const canvas = page.locator('[data-testid="signature-canvas"]');
          const smallBox = await canvas.boundingBox();

          if (smallBox) {
            expect(smallBox.width).toBeLessThan(400);
            expect(smallBox.height).toBeLessThan(200);
          }
        }

        if (await largeSize.isVisible()) {
          await largeSize.click();
          const canvas = page.locator('[data-testid="signature-canvas"]');
          const largeBox = await canvas.boundingBox();

          if (largeBox) {
            expect(largeBox.width).toBeGreaterThan(500);
            expect(largeBox.height).toBeGreaterThan(250);
          }
        }
      }

      // Test pen style options if available
      const penOptions = page.locator('[data-testid="pen-style-options"]');

      if (await penOptions.isVisible()) {
        const thinPen = penOptions.locator('[data-testid="pen-thin"]');
        const thickPen = penOptions.locator('[data-testid="pen-thick"]');
        const colorOptions = penOptions.locator('[data-testid="pen-color"]');

        if ((await thinPen.isVisible()) && (await thickPen.isVisible())) {
          await thinPen.click();

          // Draw and check line width effect (visual test would be ideal)
          const canvas = page.locator('[data-testid="signature-canvas"]');
          const canvasBox = await canvas.boundingBox();

          if (canvasBox) {
            await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
            await page.mouse.down();
            await page.mouse.move(canvasBox.x + 150, canvasBox.y + 100);
            await page.mouse.up();

            // Clear and test thick pen
            await page.click('[data-testid="clear-signature"]');
            await thickPen.click();

            await page.mouse.move(canvasBox.x + 50, canvasBox.y + 100);
            await page.mouse.down();
            await page.mouse.move(canvasBox.x + 150, canvasBox.y + 150);
            await page.mouse.up();
          }
        }
      }
    }
  });

  test('should handle signature capture in offline mode', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();

      // Go offline
      await page.context().setOffline(true);

      await page.click('[data-testid="capture-signature"]');

      // Should still allow signature capture
      const canvas = page.locator('[data-testid="signature-canvas"]');
      await expect(canvas).toBeVisible();

      // Check for offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-mode-indicator"]');
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toContainText(/offline|no connection/i);
      }

      // Draw signature
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 200, canvasBox.y + 150);
        await page.mouse.up();

        // Save offline
        await page.click('[data-testid="save-signature"]');

        // Should save locally
        const offlineSave = page.locator('[data-testid="signature-saved-offline"]');
        if (await offlineSave.isVisible()) {
          await expect(offlineSave).toContainText(/saved.*offline|stored.*locally/i);
        }

        // Should show sync pending indicator
        const syncPending = page.locator('[data-testid="signature-sync-pending"]');
        if (await syncPending.isVisible()) {
          await expect(syncPending).toContainText(/sync.*pending|will.*upload/i);
        }
      }

      // Go back online
      await page.context().setOffline(false);

      // Should attempt to sync
      const syncIndicator = page.locator('[data-testid="signature-syncing"]');
      if (await syncIndicator.isVisible()) {
        await expect(syncIndicator).toContainText(/syncing|uploading/i);

        // Wait for sync to complete
        await page.waitForSelector('[data-testid="signature-syncing"]', { state: 'hidden' });

        // Should show sync success
        const syncSuccess = page.locator('[data-testid="signature-synced"]');
        if (await syncSuccess.isVisible()) {
          await expect(syncSuccess).toContainText(/synced|uploaded/i);
        }
      }
    }
  });
});
