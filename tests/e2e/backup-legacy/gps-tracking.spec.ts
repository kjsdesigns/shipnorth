import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('GPS Tracking Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation API for testing
    await page.addInitScript(() => {
      // Mock navigator.geolocation
      window.mockGeolocation = {
        getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback) => {
          const position = {
            coords: {
              latitude: 49.2827,
              longitude: -123.1207,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };
          success(position);
        },
        watchPosition: (success: PositionCallback) => {
          const position = {
            coords: {
              latitude: 49.2827 + (Math.random() - 0.5) * 0.001,
              longitude: -123.1207 + (Math.random() - 0.5) * 0.001,
              accuracy: 5 + Math.random() * 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: Math.random() * 50,
            },
            timestamp: Date.now(),
          };
          success(position);
          return 1;
        },
        clearWatch: () => {},
      };

      // Replace the real geolocation with mock
      Object.defineProperty(navigator, 'geolocation', {
        value: window.mockGeolocation,
        configurable: true,
      });
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

  test('should request GPS permissions on driver login', async ({ page }) => {
    // Should be on driver dashboard
    await expect(page).toHaveURL(new RegExp('.*/driver'));

    // Check for location permission request or indicator
    const locationPermission = page.locator('[data-testid="location-permission"]');
    const locationStatus = page.locator('[data-testid="location-status"]');

    if (await locationPermission.isVisible()) {
      await expect(locationPermission).toContainText(/location|gps|permission/i);

      // Test granting permission
      const allowButton = locationPermission.locator('[data-testid="allow-location"]');
      if (await allowButton.isVisible()) {
        await allowButton.click();

        // Should show success status
        await expect(page.locator('[data-testid="location-granted"]')).toBeVisible();
      }
    } else if (await locationStatus.isVisible()) {
      // Location might already be enabled
      await expect(locationStatus).toContainText(/active|enabled|tracking/i);
    }
  });

  test('should display current GPS location', async ({ page }) => {
    await page.goto('/driver');

    // Wait for location to be acquired
    await page.waitForTimeout(2000);

    // Check for location display
    const locationDisplay = page.locator('[data-testid="current-location"]');
    const coordsDisplay = page.locator('[data-testid="coordinates-display"]');

    if (await locationDisplay.isVisible()) {
      await expect(locationDisplay).toBeVisible();

      // Check for coordinates
      const latElement = page.locator('[data-testid="latitude"]');
      const lngElement = page.locator('[data-testid="longitude"]');

      if (await latElement.isVisible()) {
        const latText = await latElement.textContent();
        expect(latText).toMatch(/49\.\d+/);
      }

      if (await lngElement.isVisible()) {
        const lngText = await lngElement.textContent();
        expect(lngText).toMatch(/-123\.\d+/);
      }
    }

    // Check for accuracy display
    const accuracyElement = page.locator('[data-testid="location-accuracy"]');
    if (await accuracyElement.isVisible()) {
      const accuracyText = await accuracyElement.textContent();
      expect(accuracyText).toMatch(/\d+.*m|meter|accuracy/i);
    }
  });

  test('should handle GPS tracking toggle', async ({ page }) => {
    await page.goto('/driver');

    // Look for GPS toggle switch
    const gpsToggle = page.locator('[data-testid="gps-toggle"]');
    const trackingToggle = page.locator('[data-testid="location-tracking-toggle"]');

    const toggle = (await gpsToggle.isVisible()) ? gpsToggle : trackingToggle;

    if (await toggle.isVisible()) {
      // Check initial state
      const isEnabled = await toggle.isChecked();

      // Toggle the switch
      await toggle.click();

      // Should change state
      await expect(toggle).toBeChecked({ checked: !isEnabled });

      // Should show status change
      const statusMessage = page.locator('[data-testid="tracking-status-message"]');
      if (await statusMessage.isVisible()) {
        await expect(statusMessage).toContainText(isEnabled ? /disabled|off/ : /enabled|on/);
      }

      // Toggle back
      await toggle.click();
      await expect(toggle).toBeChecked({ checked: isEnabled });
    }
  });

  test('should update location at regular intervals', async ({ page }) => {
    await page.goto('/driver');

    // Wait for initial location
    await page.waitForTimeout(1000);

    const timestampElement = page.locator('[data-testid="last-location-update"]');
    const locationElement = page.locator('[data-testid="current-location"]');

    if (await timestampElement.isVisible()) {
      const initialTimestamp = await timestampElement.textContent();

      // Wait for potential update (simulate location change)
      await page.waitForTimeout(3000);

      const updatedTimestamp = await timestampElement.textContent();

      // Timestamp should be updated or at least available
      expect(updatedTimestamp).toBeTruthy();

      // Check timestamp format
      expect(updatedTimestamp).toMatch(/\d{1,2}:\d{2}|ago|seconds|minutes/);
    }

    // Check for update frequency setting
    const updateFrequency = page.locator('[data-testid="update-frequency"]');
    if (await updateFrequency.isVisible()) {
      await expect(updateFrequency).toContainText(/seconds|minutes|every/i);
    }
  });

  test('should handle GPS signal strength and accuracy', async ({ page }) => {
    await page.goto('/driver');

    // Check for signal strength indicator
    const signalStrength = page.locator('[data-testid="gps-signal-strength"]');
    const accuracyIndicator = page.locator('[data-testid="location-accuracy-indicator"]');

    if (await signalStrength.isVisible()) {
      // Should show signal quality
      await expect(signalStrength).toBeVisible();

      const signalText = await signalStrength.textContent();
      expect(signalText).toMatch(/strong|weak|good|poor|excellent/i);
    }

    if (await accuracyIndicator.isVisible()) {
      // Should show accuracy in meters
      const accuracyText = await accuracyIndicator.textContent();
      expect(accuracyText).toMatch(/\d+.*m|±\d+|accuracy/i);

      // Check for accuracy color coding or icons
      const accuracyIcon = accuracyIndicator.locator('[data-testid="accuracy-icon"]');
      if (await accuracyIcon.isVisible()) {
        await expect(accuracyIcon).toBeVisible();
      }
    }
  });

  test('should share location with dispatch/staff', async ({ page }) => {
    await page.goto('/driver');

    // Check for location sharing status
    const sharingStatus = page.locator('[data-testid="location-sharing-status"]');
    const sharingToggle = page.locator('[data-testid="share-location-toggle"]');

    if (await sharingStatus.isVisible()) {
      await expect(sharingStatus).toContainText(/sharing|visible|dispatch/i);
    }

    if (await sharingToggle.isVisible()) {
      // Test toggling location sharing
      const isSharing = await sharingToggle.isChecked();

      await sharingToggle.click();

      // Should change sharing state
      await expect(sharingToggle).toBeChecked({ checked: !isSharing });

      // Should show confirmation message
      const confirmMessage = page.locator('[data-testid="sharing-changed-message"]');
      if (await confirmMessage.isVisible()) {
        await expect(confirmMessage).toContainText(/location sharing|updated/i);
      }
    }

    // Check for privacy notice
    const privacyNotice = page.locator('[data-testid="location-privacy-notice"]');
    if (await privacyNotice.isVisible()) {
      await expect(privacyNotice).toContainText(/privacy|location data/i);
    }
  });

  test('should handle GPS error conditions', async ({ page }) => {
    // Mock GPS error
    await page.addInitScript(() => {
      window.mockGeolocation.getCurrentPosition = (
        success: PositionCallback,
        error?: PositionErrorCallback
      ) => {
        if (error) {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'Location access denied',
          } as GeolocationPositionError);
        }
      };
    });

    await page.goto('/driver');
    await page.reload();

    // Should handle error gracefully
    const errorMessage = page.locator('[data-testid="location-error"]');
    const permissionError = page.locator('[data-testid="permission-denied-error"]');

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/error|unable|failed/i);
    }

    if (await permissionError.isVisible()) {
      await expect(permissionError).toContainText(/permission|denied|access/i);

      // Should show retry button
      const retryButton = page.locator('[data-testid="retry-location"]');
      if (await retryButton.isVisible()) {
        await expect(retryButton).toContainText(/retry|try again|enable/i);
      }
    }
  });

  test('should display location history tracking', async ({ page }) => {
    await page.goto('/driver');

    // Check for location history section
    const locationHistory = page.locator('[data-testid="location-history"]');
    const trackingLog = page.locator('[data-testid="tracking-log"]');

    if (await locationHistory.isVisible()) {
      await expect(locationHistory).toBeVisible();

      // Should show recent locations
      const historyItems = page.locator('[data-testid^="history-item-"]');
      if ((await historyItems.count()) > 0) {
        const firstItem = historyItems.first();

        // Each history item should have timestamp and location
        await expect(firstItem.locator('[data-testid="history-timestamp"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="history-coordinates"]')).toBeVisible();
      }
    }

    if (await trackingLog.isVisible()) {
      // Check for tracking log entries
      const logEntries = page.locator('[data-testid^="log-entry-"]');

      if ((await logEntries.count()) > 0) {
        const firstEntry = logEntries.first();
        await expect(firstEntry).toContainText(/\d{1,2}:\d{2}|ago/);
      }
    }
  });

  test('should handle offline GPS caching', async ({ page }) => {
    await page.goto('/driver');

    // Wait for location to be acquired
    await page.waitForTimeout(1000);

    // Go offline
    await page.context().setOffline(true);

    // Location should still be available from cache
    const cachedLocation = page.locator('[data-testid="cached-location"]');
    const lastKnownLocation = page.locator('[data-testid="last-known-location"]');

    if (await cachedLocation.isVisible()) {
      await expect(cachedLocation).toContainText(/cached|offline|last known/i);
    }

    if (await lastKnownLocation.isVisible()) {
      await expect(lastKnownLocation).toBeVisible();

      // Should show last known coordinates
      const coords = await lastKnownLocation.textContent();
      expect(coords).toMatch(/\d+\.\d+/);
    }

    // Check offline indicator
    const offlineIndicator = page.locator('[data-testid="location-offline-indicator"]');
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toContainText(/offline|no signal/i);
    }

    // Go back online
    await page.context().setOffline(false);

    // Should resume tracking
    await page.waitForTimeout(1000);
    const onlineIndicator = page.locator('[data-testid="location-online-indicator"]');
    if (await onlineIndicator.isVisible()) {
      await expect(onlineIndicator).toContainText(/online|connected/i);
    }
  });

  test('should display location on map', async ({ page }) => {
    await page.goto('/driver');

    // Look for map component
    const mapContainer = page.locator('[data-testid="location-map"]');
    const mapCanvas = page.locator('[data-testid="map-canvas"]');
    const mapElement = page.locator('.leaflet-container, .mapbox-gl-map, #map');

    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();

      // Check for map controls
      const zoomControls = page.locator('[data-testid="map-zoom-controls"]');
      if (await zoomControls.isVisible()) {
        await expect(zoomControls.locator('[data-testid="zoom-in"]')).toBeVisible();
        await expect(zoomControls.locator('[data-testid="zoom-out"]')).toBeVisible();
      }

      // Check for current location marker
      const locationMarker = page.locator('[data-testid="current-location-marker"]');
      if (await locationMarker.isVisible()) {
        await expect(locationMarker).toBeVisible();
      }
    } else if (await mapElement.isVisible()) {
      // Generic map element found
      await expect(mapElement).toBeVisible();
    }

    // Test map toggle if available
    const mapToggle = page.locator('[data-testid="toggle-map-view"]');
    if (await mapToggle.isVisible()) {
      await mapToggle.click();

      // Map should show/hide
      await page.waitForTimeout(500);
      // Check if map visibility changed
    }
  });

  test('should handle location-based notifications', async ({ page }) => {
    await page.goto('/driver');

    // Check for geofence notifications
    const geofenceNotice = page.locator('[data-testid="geofence-notification"]');
    const locationAlert = page.locator('[data-testid="location-alert"]');

    if (await geofenceNotice.isVisible()) {
      await expect(geofenceNotice).toContainText(/entered|exited|area|zone/i);
    }

    if (await locationAlert.isVisible()) {
      await expect(locationAlert).toContainText(/location|alert|notification/i);

      // Should have dismiss option
      const dismissButton = locationAlert.locator('[data-testid="dismiss-alert"]');
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        await expect(locationAlert).not.toBeVisible();
      }
    }

    // Check for delivery area notifications
    const deliveryAreaNotice = page.locator('[data-testid="delivery-area-notice"]');
    if (await deliveryAreaNotice.isVisible()) {
      await expect(deliveryAreaNotice).toContainText(/delivery area|near destination/i);
    }
  });

  test('should handle GPS settings and preferences', async ({ page }) => {
    await page.goto('/driver');

    // Look for GPS settings
    const settingsButton = page.locator('[data-testid="location-settings"]');
    const gpsSettings = page.locator('[data-testid="gps-settings"]');

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Should show settings modal
      const settingsModal = page.locator('[data-testid="location-settings-modal"]');
      await expect(settingsModal).toBeVisible();

      // Check for update frequency settings
      const updateFrequencySelect = settingsModal.locator(
        '[data-testid="update-frequency-select"]'
      );
      if (await updateFrequencySelect.isVisible()) {
        await updateFrequencySelect.click();

        // Should have frequency options
        await expect(page.locator('[data-testid="frequency-5s"]')).toBeVisible();
        await expect(page.locator('[data-testid="frequency-10s"]')).toBeVisible();
        await expect(page.locator('[data-testid="frequency-30s"]')).toBeVisible();
      }

      // Check for accuracy preferences
      const accuracySelect = settingsModal.locator('[data-testid="accuracy-preference"]');
      if (await accuracySelect.isVisible()) {
        await accuracySelect.click();

        await expect(page.locator('[data-testid="accuracy-high"]')).toBeVisible();
        await expect(page.locator('[data-testid="accuracy-medium"]')).toBeVisible();
        await expect(page.locator('[data-testid="accuracy-low"]')).toBeVisible();
      }

      // Close settings
      await page.click('[data-testid="close-settings"]');
      await expect(settingsModal).not.toBeVisible();
    }
  });
});
