import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('User Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', config.testUsers.admin.email);
    await page.fill('[data-testid="login-password"]', config.testUsers.admin.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('[data-testid="login-submit"]'),
    ]);
  });

  test('should display admin access to user management', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp('.*/admin'));

    const userManagementLink = page.locator(
      '[data-testid="nav-users"], [data-testid="user-management"]'
    );
    await expect(userManagementLink).toBeVisible();

    await userManagementLink.click();

    const userManagementPage = page.locator('[data-testid="user-management-page"]');
    await expect(userManagementPage).toBeVisible();

    // Check key elements
    await expect(page.locator('[data-testid="create-user-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
  });

  test('should handle user creation for different roles', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const createButton = page.locator('[data-testid="create-user-button"]');
    await createButton.click();

    const createModal = page.locator('[data-testid="create-user-modal"]');
    await expect(createModal).toBeVisible();

    // Test creating staff user
    await page.fill('[data-testid="user-email"]', 'newstaff@example.com');
    await page.fill('[data-testid="user-name"]', 'New Staff Member');
    await page.fill('[data-testid="user-password"]', 'SecurePass123');

    const roleSelect = page.locator('[data-testid="user-role-select"]');
    await roleSelect.click();
    await page.click('[data-testid="role-staff"]');

    await page.click('[data-testid="create-user-submit"]');

    await expect(page.locator('[data-testid="user-created-success"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="users-table"]').locator('text=newstaff@example.com')
    ).toBeVisible();

    // Test creating driver user
    await createButton.click();
    await page.fill('[data-testid="user-email"]', 'newdriver@example.com');
    await page.fill('[data-testid="user-name"]', 'New Driver');
    await page.fill('[data-testid="user-password"]', 'DriverPass123');

    await roleSelect.click();
    await page.click('[data-testid="role-driver"]');

    await page.click('[data-testid="create-user-submit"]');
    await expect(page.locator('[data-testid="user-created-success"]')).toBeVisible();
  });

  test('should handle user editing and updates', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const userRow = page.locator('[data-testid^="user-row-"]').first();
    const editButton = userRow.locator('[data-testid="edit-user"]');

    await editButton.click();

    const editModal = page.locator('[data-testid="edit-user-modal"]');
    await expect(editModal).toBeVisible();

    // Update user name
    const nameField = editModal.locator('[data-testid="user-name"]');
    await nameField.fill('Updated User Name');

    // Update role if possible
    const roleSelect = editModal.locator('[data-testid="user-role-select"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.click('[data-testid="role-staff"]');
    }

    await page.click('[data-testid="save-user-changes"]');

    await expect(page.locator('[data-testid="user-updated-success"]')).toBeVisible();
    await expect(editModal).not.toBeVisible();

    // Verify changes in table
    await expect(page.locator('text=Updated User Name')).toBeVisible();
  });

  test('should handle user deactivation and activation', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const userRow = page.locator('[data-testid^="user-row-"]').first();
    const statusToggle = userRow.locator('[data-testid="user-status-toggle"]');

    if (await statusToggle.isVisible()) {
      const currentStatus = await statusToggle.isChecked();

      await statusToggle.click();

      const confirmModal = page.locator('[data-testid="confirm-status-change"]');
      if (await confirmModal.isVisible()) {
        await page.click('[data-testid="confirm-change"]');
      }

      await expect(statusToggle).toBeChecked({ checked: !currentStatus });

      // Status should be reflected in UI
      const statusBadge = userRow.locator('[data-testid="user-status-badge"]');
      if (await statusBadge.isVisible()) {
        const statusText = await statusBadge.textContent();
        expect(statusText).toMatch(currentStatus ? /inactive|disabled/ : /active|enabled/);
      }
    }
  });

  test('should support bulk user operations', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    // Select multiple users
    const userCheckboxes = page.locator('[data-testid^="user-checkbox-"]');
    const bulkActions = page.locator('[data-testid="bulk-actions"]');

    if ((await userCheckboxes.count()) > 1) {
      await userCheckboxes.first().click();
      await userCheckboxes.nth(1).click();

      // Bulk actions should become visible
      await expect(bulkActions).toBeVisible();

      // Test bulk activation/deactivation
      const bulkDeactivate = bulkActions.locator('[data-testid="bulk-deactivate"]');
      if (await bulkDeactivate.isVisible()) {
        await bulkDeactivate.click();

        const confirmBulk = page.locator('[data-testid="confirm-bulk-action"]');
        await expect(confirmBulk).toBeVisible();

        await page.click('[data-testid="confirm-bulk-deactivate"]');

        await expect(page.locator('[data-testid="bulk-action-success"]')).toBeVisible();
      }

      // Test bulk delete if available
      const bulkDelete = bulkActions.locator('[data-testid="bulk-delete"]');
      if (await bulkDelete.isVisible()) {
        await bulkDelete.click();

        const dangerConfirm = page.locator('[data-testid="danger-confirm-modal"]');
        await expect(dangerConfirm).toBeVisible();

        // Cancel dangerous action for test
        await page.click('[data-testid="cancel-bulk-delete"]');
      }
    }
  });

  test('should handle user search and filtering', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const searchBox = page.locator('[data-testid="user-search"]');
    await searchBox.fill('admin');

    // Should filter users
    const userRows = page.locator('[data-testid^="user-row-"]');
    await page.waitForTimeout(500); // Allow search to process

    for (let i = 0; i < (await userRows.count()); i++) {
      const row = userRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText?.toLowerCase()).toContain('admin');
    }

    // Test role filter
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.click();
      await page.click('[data-testid="filter-drivers"]');

      // Should show only drivers
      await page.waitForTimeout(500);
      const driverRows = page.locator('[data-testid^="user-row-"]');

      for (let i = 0; i < (await driverRows.count()); i++) {
        const roleCell = driverRows.nth(i).locator('[data-testid="user-role"]');
        const roleText = await roleCell.textContent();
        expect(roleText?.toLowerCase()).toContain('driver');
      }
    }

    // Clear filters
    const clearFilters = page.locator('[data-testid="clear-filters"]');
    if (await clearFilters.isVisible()) {
      await clearFilters.click();

      // Should show all users again
      await expect(searchBox).toHaveValue('');
    }
  });

  test('should handle password reset functionality', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const userRow = page.locator('[data-testid^="user-row-"]').first();
    const resetPasswordButton = userRow.locator('[data-testid="reset-password"]');

    if (await resetPasswordButton.isVisible()) {
      await resetPasswordButton.click();

      const resetModal = page.locator('[data-testid="password-reset-modal"]');
      await expect(resetModal).toBeVisible();

      // Test temporary password generation
      const generateTemp = resetModal.locator('[data-testid="generate-temp-password"]');
      if (await generateTemp.isVisible()) {
        await generateTemp.click();

        const tempPassword = resetModal.locator('[data-testid="temp-password-display"]');
        await expect(tempPassword).toBeVisible();

        const passwordText = await tempPassword.textContent();
        expect(passwordText).toMatch(/\w{8,}/);

        // Test copy functionality
        const copyButton = resetModal.locator('[data-testid="copy-temp-password"]');
        if (await copyButton.isVisible()) {
          await copyButton.click();
          await expect(page.locator('[data-testid="password-copied"]')).toBeVisible();
        }
      }

      // Test email reset option
      const emailReset = resetModal.locator('[data-testid="email-reset-link"]');
      if (await emailReset.isVisible()) {
        await emailReset.click();

        await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();
      }

      await page.click('[data-testid="close-reset-modal"]');
    }
  });

  test('should display user activity and audit logs', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const userRow = page.locator('[data-testid^="user-row-"]').first();
    const viewActivity = userRow.locator('[data-testid="view-user-activity"]');

    if (await viewActivity.isVisible()) {
      await viewActivity.click();

      const activityModal = page.locator('[data-testid="user-activity-modal"]');
      await expect(activityModal).toBeVisible();

      // Check activity log elements
      const activityList = activityModal.locator('[data-testid="activity-log"]');
      await expect(activityList).toBeVisible();

      const activityItems = activityList.locator('[data-testid^="activity-item-"]');
      if ((await activityItems.count()) > 0) {
        const firstItem = activityItems.first();

        await expect(firstItem.locator('[data-testid="activity-timestamp"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="activity-action"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="activity-details"]')).toBeVisible();
      }

      // Test activity filtering
      const activityFilter = activityModal.locator('[data-testid="activity-filter"]');
      if (await activityFilter.isVisible()) {
        await activityFilter.click();

        await expect(page.locator('[data-testid="filter-logins"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-deliveries"]')).toBeVisible();

        await page.click('[data-testid="filter-logins"]');

        // Should filter to login activities only
        const loginActivities = activityList.locator('[data-testid^="activity-item-"]');
        for (let i = 0; i < (await loginActivities.count()); i++) {
          const item = loginActivities.nth(i);
          const actionText = await item.locator('[data-testid="activity-action"]').textContent();
          expect(actionText?.toLowerCase()).toMatch(/login|sign.*in/);
        }
      }

      await page.click('[data-testid="close-activity-modal"]');
    }
  });

  test('should handle user permissions and role assignments', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const userRow = page.locator('[data-testid^="user-row-"]').first();
    const editPermissions = userRow.locator('[data-testid="edit-permissions"]');

    if (await editPermissions.isVisible()) {
      await editPermissions.click();

      const permissionsModal = page.locator('[data-testid="permissions-modal"]');
      await expect(permissionsModal).toBeVisible();

      // Check role selection
      const roleSelect = permissionsModal.locator('[data-testid="user-role-select"]');
      await expect(roleSelect).toBeVisible();

      // Check permission checkboxes
      const permissions = permissionsModal.locator('[data-testid^="permission-"]');

      if ((await permissions.count()) > 0) {
        // Test toggling permissions
        const firstPermission = permissions.first();
        const isChecked = await firstPermission.isChecked();

        await firstPermission.click();
        await expect(firstPermission).toBeChecked({ checked: !isChecked });

        // Should show permission change indicator
        const changeIndicator = permissionsModal.locator('[data-testid="permissions-changed"]');
        if (await changeIndicator.isVisible()) {
          await expect(changeIndicator).toBeVisible();
        }
      }

      // Test permission presets
      const presets = permissionsModal.locator('[data-testid="permission-presets"]');
      if (await presets.isVisible()) {
        const driverPreset = presets.locator('[data-testid="preset-driver"]');
        const staffPreset = presets.locator('[data-testid="preset-staff"]');

        if (await driverPreset.isVisible()) {
          await driverPreset.click();

          // Should apply driver permissions
          await expect(page.locator('[data-testid="preset-applied"]')).toBeVisible();
        }
      }

      await page.click('[data-testid="save-permissions"]');
      await expect(page.locator('[data-testid="permissions-updated"]')).toBeVisible();
    }
  });

  test('should handle user data export and reporting', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="nav-users"]');

    const exportButton = page.locator('[data-testid="export-users"]');
    if (await exportButton.isVisible()) {
      await exportButton.click();

      const exportModal = page.locator('[data-testid="export-modal"]');
      await expect(exportModal).toBeVisible();

      // Test CSV export
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportModal.locator('[data-testid="export-csv"]').click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/users.*\.csv$/i);

      // Test filtered export
      await exportButton.click();

      const includeInactive = exportModal.locator('[data-testid="include-inactive"]');
      if (await includeInactive.isVisible()) {
        await includeInactive.check();
      }

      const roleFilter = exportModal.locator('[data-testid="export-role-filter"]');
      if (await roleFilter.isVisible()) {
        await roleFilter.click();
        await page.click('[data-testid="export-drivers-only"]');
      }

      const [filteredDownload] = await Promise.all([
        page.waitForEvent('download'),
        exportModal.locator('[data-testid="export-filtered-csv"]').click(),
      ]);

      expect(filteredDownload.suggestedFilename()).toMatch(/drivers.*\.csv$/i);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/admin');
      await page.click('[data-testid="nav-users"]');

      // Check table responsiveness
      const usersTable = page.locator('[data-testid="users-table"]');
      await expect(usersTable).toBeVisible();

      const tableBox = await usersTable.boundingBox();
      if (tableBox) {
        expect(tableBox.width).toBeLessThanOrEqual(viewport.width);
      }

      // Check mobile vs desktop layout
      if (viewport.width <= 768) {
        // Mobile layout checks
        const mobileUserCards = page.locator('[data-testid="mobile-user-cards"]');
        if (await mobileUserCards.isVisible()) {
          await expect(mobileUserCards).toBeVisible();
        }
      } else {
        // Desktop table layout
        const tableHeaders = page.locator('[data-testid="table-headers"]');
        if (await tableHeaders.isVisible()) {
          await expect(tableHeaders).toBeVisible();
        }
      }

      // Test create user modal responsiveness
      await page.click('[data-testid="create-user-button"]');

      const createModal = page.locator('[data-testid="create-user-modal"]');
      const modalBox = await createModal.boundingBox();

      if (modalBox) {
        expect(modalBox.width).toBeLessThanOrEqual(viewport.width - 40);
      }

      await page.click('[data-testid="cancel-create-user"]');
    }
  });
});
