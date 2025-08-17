import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { PackageController } from '../controllers/package.controller';

const router = Router();

// Use controller methods for clean separation
router.get('/', PackageController.listPackages);
router.get('/stats/overview', PackageController.getPackageStats);
router.get('/:id', PackageController.getPackage);
router.post('/', authorize('staff', 'admin'), PackageController.createPackage);
router.post('/bulk-assign', authorize('staff', 'admin'), PackageController.bulkAssignPackages);
router.post('/:id/mark-delivered', authorize('staff', 'admin'), PackageController.markPackageDelivered);
router.post('/:id/purchase-label', authorize('staff', 'admin'), PackageController.purchaseLabel);
router.delete('/:id', authorize('staff', 'admin'), PackageController.deletePackage);

export default router;