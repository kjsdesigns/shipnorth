import { Package, Customer, DeliveryConfirmation, PackageStats } from '@shipnorth/shared';
import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';
import { LoadModel } from '../models/load';
import { NotificationService } from './notifications';

export class PackageService {
  static async createPackage(
    packageData: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Package> {
    // Validate customer exists
    const customer = await CustomerModel.findById(packageData.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newPackage = await PackageModel.create(packageData);

    // Send notification for package creation
    try {
      await NotificationService.notifyPackageStatusChange(newPackage.id, 'ready', customer, {
        trackingNumber: newPackage.trackingNumber,
      });
    } catch (error) {
      console.error('Failed to send package creation notification:', error);
    }

    return newPackage;
  }

  static async getPackageWithExpectedDelivery(
    packageId: string
  ): Promise<(Package & { expectedDeliveryDate?: string }) | null> {
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) return null;

    const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(packageId);

    return {
      ...pkg,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
    };
  }

  static async bulkAssignToLoad(
    packageIds: string[],
    loadId: string
  ): Promise<{ success: number; failed: string[] }> {
    const results = { success: 0, failed: [] as string[] };

    // Validate load exists
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    for (const packageId of packageIds) {
      try {
        await PackageModel.update(packageId, { loadId });
        results.success++;

        // Send notification about load assignment
        const pkg = await PackageModel.findById(packageId);
        if (pkg) {
          const customer = await CustomerModel.findById(pkg.customerId);
          if (customer) {
            const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(packageId);
            await NotificationService.notifyPackageStatusChange(packageId, 'in_transit', customer, {
              trackingNumber: pkg.trackingNumber,
              expectedDeliveryDate,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to assign package ${packageId}:`, error);
        results.failed.push(packageId);
      }
    }

    return results;
  }

  static async markAsDelivered(
    packageId: string,
    deliveryData: Partial<DeliveryConfirmation> & { confirmedBy: string }
  ): Promise<Package | null> {
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) return null;

    const updatedPackage = await PackageModel.markAsDelivered(packageId, deliveryData);
    if (!updatedPackage) return null;

    // Send delivery notification
    try {
      const customer = await CustomerModel.findById(pkg.customerId);
      if (customer) {
        await NotificationService.notifyPackageStatusChange(packageId, 'delivered', customer, {
          trackingNumber: updatedPackage.trackingNumber,
          deliveryConfirmation: updatedPackage.deliveryConfirmation,
        });
      }
    } catch (error) {
      console.error('Failed to send delivery notification:', error);
    }

    return updatedPackage;
  }

  static async getPackageStats(): Promise<PackageStats> {
    const stats = await PackageModel.getPackageStats();

    return {
      ...stats,
      delivered: 0, // Would need to implement this query
      total: stats.unassigned + stats.assigned + stats.in_transit,
    };
  }

  static async getPackagesWithFilters(filters: {
    status?: string;
    customerId?: string;
    loadId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    page?: number;
  }): Promise<{ packages: (Package & { expectedDeliveryDate?: string })[]; total: number }> {
    let packages: Package[];

    if (filters.status) {
      packages = await PackageModel.getPackagesByLoadStatus(filters.status);
    } else if (filters.customerId) {
      packages = await PackageModel.findByCustomer(filters.customerId);
    } else {
      packages = await PackageModel.list(filters.limit || 50);
    }

    // Add expected delivery dates
    const packagesWithDelivery = await Promise.all(
      packages.map(async (pkg) => {
        const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(pkg.id);
        return { ...pkg, expectedDeliveryDate: expectedDeliveryDate || undefined };
      })
    );

    // Apply pagination
    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 50);
    const endIndex = startIndex + (filters.limit || 50);
    const paginatedPackages = packagesWithDelivery.slice(startIndex, endIndex);

    return {
      packages: paginatedPackages,
      total: packagesWithDelivery.length,
    };
  }

  static async purchaseLabel(packageId: string): Promise<any> {
    const result = await PackageModel.purchaseLabel(packageId);
    if (!result) throw new Error('Package not found');

    // Send notification about label purchase
    try {
      const pkg = await PackageModel.findById(packageId);
      if (pkg) {
        const customer = await CustomerModel.findById(pkg.customerId);
        if (customer) {
          await NotificationService.notifyPackageStatusChange(packageId, 'ready', customer, {
            trackingNumber: result.trackingNumber,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send label purchase notification:', error);
    }

    return result;
  }

  static async deletePackage(packageId: string): Promise<boolean> {
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) return false;

    // Check if package can be deleted (business rules)
    if (pkg.labelStatus === 'purchased' && pkg.paymentStatus === 'paid') {
      throw new Error('Cannot delete package with purchased label and paid status');
    }

    return await PackageModel.delete(packageId);
  }
}
