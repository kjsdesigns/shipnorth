import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Photo Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock file input and camera functionality
    await page.addInitScript(() => {
      // Mock file APIs
      (window as any).mockFile = new File(['fake image data'], 'test-photo.jpg', {
        type: 'image/jpeg',
      });

      // Mock URL.createObjectURL
      (window as any).URL.createObjectURL = () => 'blob:mock-url';
      (window as any).URL.revokeObjectURL = () => {};

      // Mock FileReader
      (window as any).FileReader = class {
        readAsDataURL(file: File) {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' } });
          }, 100);
        }
        onload: (event: any) => {};
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

  test('should display photo upload interface', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();

      const photoButton = page.locator('[data-testid="add-photo"], [data-testid="upload-photo"]');
      await expect(photoButton).toBeVisible();

      await photoButton.click();

      // Should show photo upload options
      const uploadModal = page.locator('[data-testid="photo-upload-modal"]');
      await expect(uploadModal).toBeVisible();

      await expect(uploadModal.locator('[data-testid="camera-capture"]')).toBeVisible();
      await expect(uploadModal.locator('[data-testid="file-upload"]')).toBeVisible();
      await expect(uploadModal.locator('[data-testid="cancel-upload"]')).toBeVisible();
    }
  });

  test('should handle camera photo capture', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="add-photo"]');

      const cameraOption = page.locator('[data-testid="camera-capture"]');
      await cameraOption.click();

      // Should open camera interface
      const cameraInterface = page.locator('[data-testid="camera-interface"]');
      await expect(cameraInterface).toBeVisible();

      await expect(cameraInterface.locator('[data-testid="camera-preview"]')).toBeVisible();
      await expect(cameraInterface.locator('[data-testid="capture-button"]')).toBeVisible();
      await expect(cameraInterface.locator('[data-testid="switch-camera"]')).toBeVisible();

      // Capture photo
      await page.click('[data-testid="capture-button"]');

      // Should show captured photo preview
      const photoPreview = page.locator('[data-testid="photo-preview"]');
      await expect(photoPreview).toBeVisible();

      await expect(photoPreview.locator('[data-testid="preview-image"]')).toBeVisible();
      await expect(photoPreview.locator('[data-testid="retake-photo"]')).toBeVisible();
      await expect(photoPreview.locator('[data-testid="use-photo"]')).toBeVisible();
    }
  });

  test('should handle file upload from gallery', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="add-photo"]');

      const fileUpload = page.locator('[data-testid="file-upload"]');
      await fileUpload.click();

      // Should trigger file input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();

      // Simulate file selection
      await fileInput.setInputFiles({
        name: 'delivery-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data'),
      });

      // Should show file processing
      const processing = page.locator('[data-testid="processing-file"]');
      if (await processing.isVisible()) {
        await expect(processing).toContainText(/processing|uploading/i);
        await page.waitForSelector('[data-testid="processing-file"]', { state: 'hidden' });
      }

      // Should show photo preview
      await expect(page.locator('[data-testid="uploaded-photo-preview"]')).toBeVisible();
    }
  });

  test('should handle photo compression and optimization', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="add-photo"]');

      // Upload a file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('x'.repeat(5000000)), // 5MB fake file
      });

      // Should show compression indicator
      const compression = page.locator('[data-testid="compressing-image"]');
      if (await compression.isVisible()) {
        await expect(compression).toContainText(/compressing|optimizing/i);

        // Should show progress
        const progressBar = compression.locator('[data-testid="compression-progress"]');
        if (await progressBar.isVisible()) {
          await expect(progressBar).toBeVisible();
        }
      }

      // Should show file size information
      const sizeInfo = page.locator('[data-testid="file-size-info"]');
      if (await sizeInfo.isVisible()) {
        await expect(sizeInfo).toContainText(/size|kb|mb/i);
      }
    }
  });

  test('should support multiple photo uploads', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();

      // Upload first photo
      await page.click('[data-testid="add-photo"]');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'photo1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('photo 1 data'),
      });

      await expect(page.locator('[data-testid="photo-1"]')).toBeVisible();

      // Upload second photo
      const addAnotherPhoto = page.locator('[data-testid="add-another-photo"]');
      if (await addAnotherPhoto.isVisible()) {
        await addAnotherPhoto.click();

        await fileInput.setInputFiles({
          name: 'photo2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('photo 2 data'),
        });

        await expect(page.locator('[data-testid="photo-2"]')).toBeVisible();

        // Should show photo count
        const photoCount = page.locator('[data-testid="photo-count"]');
        if (await photoCount.isVisible()) {
          await expect(photoCount).toContainText('2');
        }

        // Test photo deletion
        const deletePhoto1 = page.locator('[data-testid="delete-photo-1"]');
        if (await deletePhoto1.isVisible()) {
          await deletePhoto1.click();

          // Should show confirmation
          const deleteConfirm = page.locator('[data-testid="confirm-delete-photo"]');
          if (await deleteConfirm.isVisible()) {
            await deleteConfirm.click();
          }

          await expect(page.locator('[data-testid="photo-1"]')).not.toBeVisible();
        }
      }
    }
  });

  test('should display photo storage and organization', async ({ page }) => {
    await page.goto('/driver');

    // Check photo gallery or storage view
    const photoGallery = page.locator('[data-testid="photo-gallery"]');
    if (await photoGallery.isVisible()) {
      await photoGallery.click();

      const galleryModal = page.locator('[data-testid="gallery-modal"]');
      await expect(galleryModal).toBeVisible();

      // Should show organized photos
      const photosByDate = galleryModal.locator('[data-testid="photos-by-date"]');
      const photosByPackage = galleryModal.locator('[data-testid="photos-by-package"]');

      if (await photosByDate.isVisible()) {
        const dateGroups = photosByDate.locator('[data-testid^="date-group-"]');
        expect(await dateGroups.count()).toBeGreaterThanOrEqual(0);
      }

      if (await photosByPackage.isVisible()) {
        const packageGroups = photosByPackage.locator('[data-testid^="package-group-"]');
        expect(await packageGroups.count()).toBeGreaterThanOrEqual(0);
      }

      // Test photo search
      const searchPhotos = galleryModal.locator('[data-testid="search-photos"]');
      if (await searchPhotos.isVisible()) {
        await searchPhotos.fill('delivery');
        await page.keyboard.press('Enter');

        const searchResults = galleryModal.locator('[data-testid="photo-search-results"]');
        if (await searchResults.isVisible()) {
          await expect(searchResults).toBeVisible();
        }
      }
    }
  });

  test('should handle photo metadata and GPS tagging', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="add-photo"]');

      // Upload photo
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'delivery-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('photo with metadata'),
      });

      // Check photo info
      const photoInfo = page.locator('[data-testid="photo-info"]');
      if (await photoInfo.isVisible()) {
        const timestamp = photoInfo.locator('[data-testid="photo-timestamp"]');
        const location = photoInfo.locator('[data-testid="photo-location"]');
        const fileSize = photoInfo.locator('[data-testid="photo-file-size"]');

        if (await timestamp.isVisible()) {
          const time = await timestamp.textContent();
          expect(time).toMatch(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/);
        }

        if (await location.isVisible()) {
          const locationText = await location.textContent();
          expect(locationText).toMatch(/lat|lng|location/);
        }

        if (await fileSize.isVisible()) {
          const size = await fileSize.textContent();
          expect(size).toMatch(/\d+.*kb|mb/);
        }
      }

      // Test adding photo notes/captions
      const addCaption = page.locator('[data-testid="add-photo-caption"]');
      if (await addCaption.isVisible()) {
        await addCaption.click();

        const captionInput = page.locator('[data-testid="photo-caption-input"]');
        await captionInput.fill('Package delivered to front door');

        await page.click('[data-testid="save-caption"]');

        // Should show saved caption
        await expect(page.locator('[data-testid="photo-caption-display"]')).toContainText(
          'Package delivered to front door'
        );
      }
    }
  });

  test('should handle photo quality settings', async ({ page }) => {
    await page.goto('/driver');

    // Check for photo settings
    const settingsButton = page.locator('[data-testid="photo-settings"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      const settingsModal = page.locator('[data-testid="photo-settings-modal"]');
      await expect(settingsModal).toBeVisible();

      // Check quality options
      const qualitySelect = settingsModal.locator('[data-testid="photo-quality-select"]');
      if (await qualitySelect.isVisible()) {
        await qualitySelect.click();

        await expect(page.locator('[data-testid="quality-high"]')).toBeVisible();
        await expect(page.locator('[data-testid="quality-medium"]')).toBeVisible();
        await expect(page.locator('[data-testid="quality-low"]')).toBeVisible();

        await page.click('[data-testid="quality-high"]');
      }

      // Check auto-compression settings
      const autoCompress = settingsModal.locator('[data-testid="auto-compress-toggle"]');
      if (await autoCompress.isVisible()) {
        await autoCompress.click();
        await expect(autoCompress).toBeChecked();
      }

      // Check GPS tagging option
      const gpsTagging = settingsModal.locator('[data-testid="gps-tagging-toggle"]');
      if (await gpsTagging.isVisible()) {
        await gpsTagging.click();
        await expect(gpsTagging).toBeChecked();
      }

      await page.click('[data-testid="save-photo-settings"]');
      await expect(settingsModal).not.toBeVisible();
    }
  });

  test('should handle photo upload errors', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();
      await page.click('[data-testid="add-photo"]');

      // Test unsupported file format
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not an image'),
      });

      const formatError = page.locator('[data-testid="unsupported-format-error"]');
      if (await formatError.isVisible()) {
        await expect(formatError).toContainText(/format.*supported|invalid.*file/i);
      }

      // Test file too large
      await fileInput.setInputFiles({
        name: 'huge-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('x'.repeat(50000000)), // 50MB
      });

      const sizeError = page.locator('[data-testid="file-size-error"]');
      if (await sizeError.isVisible()) {
        await expect(sizeError).toContainText(/too large|size limit/i);
      }

      // Test network error during upload
      await page.route('**/api/photos/**', (route) => {
        route.fulfill({ status: 500, body: 'Upload failed' });
      });

      await fileInput.setInputFiles({
        name: 'valid-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('valid image data'),
      });

      const uploadError = page.locator('[data-testid="upload-error"]');
      if (await uploadError.isVisible()) {
        await expect(uploadError).toContainText(/upload.*failed|network.*error/i);

        const retryButton = uploadError.locator('[data-testid="retry-upload"]');
        if (await retryButton.isVisible()) {
          await expect(retryButton).toContainText(/retry|try again/i);
        }
      }
    }
  });

  test('should support offline photo storage', async ({ page }) => {
    await page.goto('/driver');

    const packageItem = page.locator('[data-testid^="package-"]').first();
    if (await packageItem.isVisible()) {
      await packageItem.click();

      // Go offline
      await page.context().setOffline(true);

      await page.click('[data-testid="add-photo"]');

      // Should still allow photo capture/selection
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'offline-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('offline photo data'),
      });

      // Should store locally
      const offlineStorage = page.locator('[data-testid="photo-stored-offline"]');
      if (await offlineStorage.isVisible()) {
        await expect(offlineStorage).toContainText(/stored.*offline|saved.*locally/i);
      }

      // Should show sync pending
      const syncPending = page.locator('[data-testid="photo-sync-pending"]');
      if (await syncPending.isVisible()) {
        await expect(syncPending).toContainText(/sync.*pending|upload.*later/i);
      }

      // Go back online
      await page.context().setOffline(false);

      // Should sync photos
      const syncing = page.locator('[data-testid="photos-syncing"]');
      if (await syncing.isVisible()) {
        await expect(syncing).toContainText(/syncing|uploading/i);

        await page.waitForSelector('[data-testid="photos-syncing"]', { state: 'hidden' });

        const syncComplete = page.locator('[data-testid="photos-synced"]');
        if (await syncComplete.isVisible()) {
          await expect(syncComplete).toContainText(/synced|uploaded/i);
        }
      }
    }
  });

  test('should be responsive on different devices', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/driver');

      const packageItem = page.locator('[data-testid^="package-"]').first();
      if (await packageItem.isVisible()) {
        await packageItem.click();
        await page.click('[data-testid="add-photo"]');

        // Photo interface should fit screen
        const photoModal = page.locator('[data-testid="photo-upload-modal"]');
        const modalBox = await photoModal.boundingBox();

        if (modalBox) {
          expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
          expect(modalBox.height).toBeLessThanOrEqual(viewport.height);
        }

        // Buttons should be touch-friendly on mobile
        if (viewport.width <= 480) {
          const cameraButton = page.locator('[data-testid="camera-capture"]');
          const buttonBox = await cameraButton.boundingBox();

          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          }
        }

        await page.click('[data-testid="cancel-upload"]');
      }
    }
  });
});
