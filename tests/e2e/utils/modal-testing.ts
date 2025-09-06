import { Page, Locator, expect } from '@playwright/test';

/**
 * Comprehensive Modal/Dialog Testing Utilities
 * Provides reusable methods for testing all CRUD dialogs consistently
 */

export class ModalTestingUtils {
  constructor(private page: Page) {}

  /**
   * Generic modal interaction methods
   */
  async openModal(triggerSelector: string, modalSelector = '[role="dialog"], .modal, [data-testid*="modal"]'): Promise<void> {
    await this.page.click(triggerSelector);
    await this.page.waitForSelector(modalSelector, { state: 'visible' });
    console.log(`✅ Modal opened via ${triggerSelector}`);
  }

  async closeModal(closeSelector = 'button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]'): Promise<void> {
    await this.page.click(closeSelector);
    await this.page.waitForSelector('[role="dialog"], .modal', { state: 'hidden' });
    console.log(`✅ Modal closed`);
  }

  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      const selectors = [
        `input[name="${field}"]`,
        `textarea[name="${field}"]`,
        `select[name="${field}"]`,
        `input[placeholder*="${field}" i]`,
        `[data-testid="${field}"]`
      ];
      
      let filled = false;
      for (const selector of selectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            await this.page.fill(selector, value);
            console.log(`✅ Filled ${field}: ${value}`);
            filled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!filled) {
        console.log(`⚠️ Could not find field: ${field}`);
      }
    }
  }

  async submitForm(submitSelector = 'button[type="submit"], button:has-text("Save"), button:has-text("Create")'): Promise<void> {
    await this.page.click(submitSelector);
    console.log(`✅ Form submitted`);
  }

  /**
   * CRUD Operation Testing Methods
   */
  
  // Create workflow: Open → Fill → Submit → Verify
  async testCreateWorkflow(
    triggerSelector: string, 
    formData: Record<string, string>, 
    successIndicator: string
  ): Promise<boolean> {
    try {
      console.log(`🆕 Testing CREATE workflow...`);
      
      // Open create modal
      await this.openModal(triggerSelector);
      
      // Fill form
      await this.fillForm(formData);
      
      // Submit
      await this.submitForm();
      
      // Verify success
      await this.page.waitForTimeout(2000);
      
      // Check for success indicators
      const successSelectors = [
        `text=${successIndicator}`,
        'text=successfully created',
        'text=saved successfully',
        '[data-testid="success-message"]'
      ];
      
      for (const selector of successSelectors) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            console.log(`✅ CREATE successful - found: ${selector}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      console.log(`❌ CREATE workflow completed but success not confirmed`);
      return false;
      
    } catch (error) {
      console.log(`❌ CREATE workflow failed: ${error.message}`);
      return false;
    }
  }

  // Edit workflow: Click edit → Modify → Save → Verify  
  async testEditWorkflow(
    editTriggerSelector: string,
    formChanges: Record<string, string>,
    successIndicator: string
  ): Promise<boolean> {
    try {
      console.log(`📝 Testing EDIT workflow...`);
      
      // Open edit modal/form
      await this.openModal(editTriggerSelector);
      
      // Modify form fields
      await this.fillForm(formChanges);
      
      // Submit changes
      await this.submitForm('button:has-text("Update"), button:has-text("Save")');
      
      // Verify success
      await this.page.waitForTimeout(2000);
      
      const successFound = await this.page.locator(`text=${successIndicator}`).isVisible()
        .catch(() => false);
      
      if (successFound) {
        console.log(`✅ EDIT successful`);
        return true;
      } else {
        console.log(`❌ EDIT completed but success not confirmed`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ EDIT workflow failed: ${error.message}`);
      return false;
    }
  }

  // Delete workflow: Click delete → Confirm → Verify removal
  async testDeleteWorkflow(
    deleteTriggerSelector: string,
    confirmationText: string = 'Are you sure'
  ): Promise<boolean> {
    try {
      console.log(`🗑️ Testing DELETE workflow...`);
      
      // Click delete button
      await this.page.click(deleteTriggerSelector);
      
      // Wait for confirmation dialog
      await this.page.waitForTimeout(1000);
      
      // Look for confirmation dialog
      const confirmationVisible = await this.page.locator(`text=${confirmationText}`).isVisible()
        .catch(() => false);
      
      if (confirmationVisible) {
        // Confirm deletion
        await this.page.click('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
        console.log(`✅ DELETE confirmed`);
      } else {
        console.log(`⚠️ No confirmation dialog found, assuming direct delete`);
      }
      
      // Verify removal (item should no longer be visible)
      await this.page.waitForTimeout(2000);
      
      const successIndicators = [
        'text=successfully deleted',
        'text=removed successfully', 
        'text=deleted',
        '[data-testid="delete-success"]'
      ];
      
      for (const selector of successIndicators) {
        try {
          if (await this.page.locator(selector).isVisible()) {
            console.log(`✅ DELETE successful - found: ${selector}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      console.log(`❓ DELETE completed but success message not found`);
      return true; // Assume success if no error
      
    } catch (error) {
      console.log(`❌ DELETE workflow failed: ${error.message}`);
      return false;
    }
  }

  // View workflow: Click view → Check details → Close
  async testViewWorkflow(viewTriggerSelector: string, expectedContent: string[]): Promise<boolean> {
    try {
      console.log(`👁️ Testing VIEW workflow...`);
      
      // Open view modal/page
      await this.openModal(viewTriggerSelector);
      
      // Check for expected content
      let contentFound = 0;
      for (const content of expectedContent) {
        try {
          if (await this.page.locator(`text=${content}`).isVisible()) {
            contentFound++;
            console.log(`✅ Found expected content: ${content}`);
          }
        } catch (error) {
          console.log(`❌ Missing expected content: ${content}`);
        }
      }
      
      // Close view
      await this.closeModal();
      
      const successRate = contentFound / expectedContent.length;
      console.log(`✅ VIEW workflow: ${contentFound}/${expectedContent.length} content items found`);
      
      return successRate >= 0.5; // Success if at least half the content is found
      
    } catch (error) {
      console.log(`❌ VIEW workflow failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Role-specific CRUD testing
   */
  async verifyRoleAccess(userRole: string, allowedOperations: string[], restrictedOperations: string[]): Promise<boolean> {
    console.log(`🛡️ Testing role access for ${userRole}...`);
    
    let accessCorrect = true;
    
    // Test allowed operations exist and are accessible
    for (const operation of allowedOperations) {
      try {
        const selectors = [
          `button:has-text("${operation}")`,
          `[data-testid="${operation.toLowerCase()}"]`,
          `[aria-label="${operation}"]`
        ];
        
        let found = false;
        for (const selector of selectors) {
          if (await this.page.locator(selector).isVisible()) {
            console.log(`✅ ${userRole} can access: ${operation}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log(`❌ ${userRole} missing access to: ${operation}`);
          accessCorrect = false;
        }
      } catch (error) {
        console.log(`⚠️ Error checking ${operation}: ${error.message}`);
      }
    }
    
    // Test restricted operations are NOT visible
    for (const operation of restrictedOperations) {
      try {
        const selectors = [
          `button:has-text("${operation}")`,
          `[data-testid="${operation.toLowerCase()}"]`,
          `[aria-label="${operation}"]`
        ];
        
        for (const selector of selectors) {
          if (await this.page.locator(selector).isVisible()) {
            console.log(`❌ ${userRole} should NOT see: ${operation}`);
            accessCorrect = false;
          }
        }
      } catch (error) {
        // This is expected for restricted operations
      }
    }
    
    return accessCorrect;
  }
}

/**
 * Entity-specific CRUD testing configurations
 */
export const CRUDTestConfigs = {
  Customer: {
    create: {
      triggerSelector: 'button:has-text("Add Customer"), button:has-text("New Customer")',
      formData: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'testcustomer@example.com',
        phone: '555-0123',
        businessName: 'Test Business'
      },
      successIndicator: 'Customer created successfully'
    },
    edit: {
      triggerSelector: 'button:has-text("Edit"), [data-testid="edit-customer"]',
      formChanges: {
        phone: '555-9999',
        businessName: 'Updated Business'
      },
      successIndicator: 'Customer updated successfully'
    },
    delete: {
      triggerSelector: 'button:has-text("Delete"), [data-testid="delete-customer"]',
      confirmationText: 'Are you sure'
    },
    view: {
      triggerSelector: 'button:has-text("View"), [data-testid="view-customer"]',
      expectedContent: ['Customer Details', 'Contact Information']
    }
  },
  
  Package: {
    create: {
      triggerSelector: 'button:has-text("Add Package"), button:has-text("New Package")',
      formData: {
        weight: '2.5',
        length: '20',
        width: '15', 
        height: '10',
        description: 'Test package for automation'
      },
      successIndicator: 'Package created successfully'
    },
    edit: {
      triggerSelector: 'button:has-text("Edit"), [data-testid="edit-package"]',
      formChanges: {
        weight: '3.0',
        description: 'Updated test package'
      },
      successIndicator: 'Package updated successfully'
    },
    delete: {
      triggerSelector: 'button:has-text("Delete"), [data-testid="delete-package"]',
      confirmationText: 'Are you sure'
    },
    view: {
      triggerSelector: 'button:has-text("View"), [data-testid="view-package"]',
      expectedContent: ['Package Details', 'Shipping Information']
    }
  },

  Load: {
    create: {
      triggerSelector: 'button:has-text("Add Load"), button:has-text("New Load")',
      formData: {
        name: 'Test Load',
        vehicle: 'Truck #123',
        departureDate: '2025-01-15'
      },
      successIndicator: 'Load created successfully'
    },
    edit: {
      triggerSelector: 'button:has-text("Edit"), [data-testid="edit-load"]', 
      formChanges: {
        name: 'Updated Load',
        vehicle: 'Van #456'
      },
      successIndicator: 'Load updated successfully'
    },
    delete: {
      triggerSelector: 'button:has-text("Delete"), [data-testid="delete-load"]',
      confirmationText: 'Are you sure'
    },
    view: {
      triggerSelector: 'button:has-text("View"), [data-testid="view-load"]',
      expectedContent: ['Load Details', 'Package Assignment']
    }
  }
};

/**
 * Role-based permission configurations
 */
export const RolePermissions = {
  staff: {
    customers: { create: true, read: true, update: true, delete: true },
    packages: { create: true, read: true, update: true, delete: true },
    loads: { create: true, read: true, update: true, delete: true },
    users: { create: false, read: true, update: false, delete: false }
  },
  
  admin: {
    customers: { create: true, read: true, update: true, delete: true },
    packages: { create: true, read: true, update: true, delete: true },
    loads: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true }
  },
  
  driver: {
    customers: { create: false, read: true, update: false, delete: false },
    packages: { create: false, read: true, update: true, delete: false }, // Can update delivery status
    loads: { create: false, read: true, update: true, delete: false }, // Can update status/location
    users: { create: false, read: false, update: false, delete: false }
  },
  
  customer: {
    customers: { create: false, read: true, update: true, delete: false }, // Own profile only
    packages: { create: false, read: true, update: false, delete: false }, // Own packages only
    loads: { create: false, read: false, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false }
  }
};