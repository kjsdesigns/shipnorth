import { Request, Response } from 'express';
import { PackageService } from '../services/package.service';
import { ResponseHelper, asyncHandler } from '../utils/response';
import { ValidationHelper } from '../utils/validation';
import { PAGINATION_DEFAULTS } from '@shipnorth/shared';

export class PackageController {
  static listPackages = asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      customerId,
      loadId,
      dateFrom,
      dateTo,
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
    } = req.query;

    const filters = {
      status: status as string,
      customerId: customerId as string,
      loadId: loadId as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      page: Number(page),
      limit: Math.min(Number(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    };

    const result = await PackageService.getPackagesWithFilters(filters);
    
    ResponseHelper.paginated(
      res,
      result.packages,
      filters.page,
      filters.limit,
      result.total,
      'Packages retrieved successfully'
    );
  });

  static getPackageStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await PackageService.getPackageStats();
    ResponseHelper.success(res, stats, 'Package statistics retrieved');
  });

  static getPackage = asyncHandler(async (req: Request, res: Response) => {
    const pkg = await PackageService.getPackageWithExpectedDelivery(req.params.id);
    
    if (!pkg) {
      return ResponseHelper.notFound(res, 'Package not found');
    }
    
    ResponseHelper.success(res, { package: pkg });
  });

  static createPackage = asyncHandler(async (req: Request, res: Response) => {
    const validation = ValidationHelper.validatePackageData(req.body);
    
    if (!validation.isValid) {
      return ResponseHelper.validationError(res, validation.errors);
    }

    const newPackage = await PackageService.createPackage(req.body);
    ResponseHelper.created(res, { package: newPackage }, 'Package created successfully');
  });

  static bulkAssignPackages = asyncHandler(async (req: Request, res: Response) => {
    const { packageIds, loadId } = req.body;

    if (!packageIds || !Array.isArray(packageIds)) {
      return ResponseHelper.badRequest(res, 'packageIds array is required');
    }

    if (!loadId) {
      return ResponseHelper.badRequest(res, 'loadId is required');
    }

    const result = await PackageService.bulkAssignToLoad(packageIds, loadId);
    
    ResponseHelper.success(res, {
      assignedCount: result.success,
      failedCount: result.failed.length,
      failedPackages: result.failed,
    }, 'Bulk assignment completed');
  });

  static markPackageDelivered = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deliveredAt, photoUrl, signature, recipientName, relationship } = req.body;
    const confirmedBy = req.user?.id || 'system';

    const updatedPackage = await PackageService.markAsDelivered(id, {
      deliveredAt,
      photoUrl,
      signature,
      recipientName,
      relationship,
      confirmedBy,
    });

    if (!updatedPackage) {
      return ResponseHelper.notFound(res, 'Package not found');
    }

    ResponseHelper.success(res, { package: updatedPackage }, 'Package marked as delivered');
  });

  static purchaseLabel = asyncHandler(async (req: Request, res: Response) => {
    const result = await PackageService.purchaseLabel(req.params.id);
    ResponseHelper.success(res, result, 'Label purchased successfully');
  });

  static deletePackage = asyncHandler(async (req: Request, res: Response) => {
    const success = await PackageService.deletePackage(req.params.id);
    
    if (!success) {
      return ResponseHelper.notFound(res, 'Package not found');
    }
    
    ResponseHelper.success(res, null, 'Package deleted successfully');
  });
}