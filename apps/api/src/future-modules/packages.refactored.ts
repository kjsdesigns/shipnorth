import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { PackageService } from '../services/package.service';
import { ResponseHelper, asyncHandler } from '../utils/response';
import { ValidationHelper } from '../utils/validation';
import { PAGINATION_DEFAULTS } from '@shipnorth/shared';

const router = Router();

// List packages with enhanced filtering
router.get('/', asyncHandler(async (req, res) => {
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
}));

// Get package statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = await PackageService.getPackageStats();
  ResponseHelper.success(res, stats, 'Package statistics retrieved');
}));

// Get package details
router.get('/:id', asyncHandler(async (req, res) => {
  const pkg = await PackageService.getPackageWithExpectedDelivery(req.params.id);
  
  if (!pkg) {
    return ResponseHelper.notFound(res, 'Package not found');
  }
  
  ResponseHelper.success(res, { package: pkg });
}));

// Create package (staff only)
router.post('/', authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const validation = ValidationHelper.validatePackageData(req.body);
  
  if (!validation.isValid) {
    return ResponseHelper.validationError(res, validation.errors);
  }

  const newPackage = await PackageService.createPackage(req.body);
  ResponseHelper.created(res, { package: newPackage }, 'Package created successfully');
}));

// Bulk assign packages to load
router.post('/bulk-assign', authorize('staff', 'admin'), asyncHandler(async (req, res) => {
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
}));

// Mark package as delivered
router.post('/:id/mark-delivered', authorize('staff', 'admin'), asyncHandler(async (req, res) => {
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
}));

// Purchase shipping label
router.post('/:id/purchase-label', authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const result = await PackageService.purchaseLabel(req.params.id);
  ResponseHelper.success(res, result, 'Label purchased successfully');
}));

// Delete package
router.delete('/:id', authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const success = await PackageService.deletePackage(req.params.id);
  
  if (!success) {
    return ResponseHelper.notFound(res, 'Package not found');
  }
  
  ResponseHelper.success(res, null, 'Package deleted successfully');
}));

export default router;