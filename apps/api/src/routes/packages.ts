/// <reference path="../types/express.d.ts" />
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { checkCASLPermission, requireCASLPortalAccess } from '../middleware/casl-permissions';
import { checkPermission, requirePortalAccess, filterByPermissions, Action, Resource } from '../middleware/simple-permissions';
import PayPalService from '../services/paypal';
import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';
import { NotificationService } from '../services/notifications';
import EasyPostService from '../services/easypost';

const router = Router();

// Rate quote endpoints
router.get('/:id/rates', 
  authenticate, 
  checkCASLPermission({
    action: 'read',
    resource: 'Package',
    getSubject: (req) => ({ id: req.params.id })
  }),
  async (req: any, res) => {
    try {
      const { id } = req.params;

      // Get package details
      const pkg = await PackageModel.findById(id);
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Additional permission check at the data level using CASL
      if (!req.ability?.can('read', 'Package', {
        customerId: pkg.customer_id
      })) {
        return res.status(403).json({ error: 'Access denied' });
      }

    // Validate package has required data
    if (!pkg.shipTo || !pkg.weight || !pkg.length || !pkg.width || !pkg.height) {
      return res.status(400).json({ error: 'Package missing required shipping data' });
    }

    // Get full address for validation
    const { AddressModel } = await import('../models/address');
    const fullAddress = await AddressModel.findById(pkg.shipTo?.addressId || '');
    if (!fullAddress) {
      return res.status(400).json({ error: 'Invalid shipping address' });
    }

    const destination = {
      name: pkg.shipTo?.name || '',
      address1: fullAddress.address1,
      address2: fullAddress.address2,
      city: fullAddress.city,
      province: fullAddress.province,
      postalCode: fullAddress.postalCode,
      country: fullAddress.country,
    };

    // Validate dimensions
    const validation = EasyPostService.validatePackageDimensions({
      packageId: id,
      weight: pkg.weight,
      dimensions: {
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      },
      destination,
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid package dimensions',
        details: validation.errors,
      });
    }

    // Get rate quotes from EasyPost
    const rates = await EasyPostService.getRateQuotes({
      packageId: id,
      weight: pkg.weight,
      dimensions: {
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      },
      destination,
    });

    console.log(`📊 Found ${rates.length} rate options for package ${id}`);

    res.json({
      packageId: id,
      rates: rates,
      recommendedRate:
        rates.find(
          (r) =>
            r.carrier === 'CanadaPost' ||
            r.carrier === 'Canada Post' ||
            r.carrier.toLowerCase().includes('canada post')
        ) || rates[0],
    });
  } catch (error: any) {
    console.error('Rate quote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save selected rate to package
router.post('/:id/rates/save', authenticate, authorize('admin', 'staff'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { rateId, carrier, service, rate, currency } = req.body;

    if (!rateId || !carrier || !service || !rate) {
      return res.status(400).json({ error: 'Missing required rate data' });
    }

    // Update package with selected rate
    const updateData = {
      quotedCarrier: carrier,
      quotedService: service,
      quotedRate: parseFloat(rate),
      quotedCurrency: currency || 'CAD',
      quotedAt: new Date().toISOString(),
      easypostRateId: rateId,
      labelStatus: 'quoted' as const,
    };

    const updatedPackage = await PackageModel.update(id, updateData);

    console.log(`💰 Rate saved for package ${id}: ${carrier} ${service} - $${rate} ${currency}`);

    res.json({
      message: 'Rate saved successfully',
      package: updatedPackage,
      selectedRate: {
        carrier,
        service,
        rate: parseFloat(rate),
        currency,
      },
    });
  } catch (error: any) {
    console.error('Save rate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List packages
router.get('/', authenticate, async (req: any, res) => {
  try {
    console.log('🚀 Packages API called with:', { status: req.query.status, limit: req.query.limit, userRole: req.user?.role });
    const { status, limit = 50, page = 1 } = req.query;

    // Get packages with customer, address, and load information
    let query = `
      SELECT 
        p.*,
        c.name as customer_name,
        c.email as customer_email,
        a.address_line1,
        a.address_line2,
        a.city,
        a.province_state as province,
        a.postal_code,
        a.country,
        lp.load_id,
        l.name as load_name,
        l.vehicle as load_vehicle,
        l.driver_id as load_driver_id
      FROM packages p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN addresses a ON p.ship_to_address_id = a.id
      LEFT JOIN load_packages lp ON p.id = lp.package_id
      LEFT JOIN loads l ON lp.load_id = l.id
    `;
    
    let params: any[] = [];
    let whereClause = '';
    
    // Add status filter if provided
    if (status) {
      if (status === 'unassigned') {
        whereClause = ' WHERE lp.load_id IS NULL';
      } else if (status === 'assigned') {
        whereClause = ' WHERE lp.load_id IS NOT NULL';
      } else if (status === 'in_transit') {
        whereClause = ' WHERE p.status = $1';
        params.push('shipped');
      } else {
        whereClause = ' WHERE p.status = $1';
        params.push(status);
      }
    }
    
    // Add customer filter for customer role
    if (req.user.role === 'customer') {
      const customerFilter = whereClause ? ' AND p.customer_id = $' + (params.length + 1) : ' WHERE p.customer_id = $1';
      whereClause += customerFilter;
      params.push(req.user.customerId);
    }
    
    query += whereClause + ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1);
    params.push(Number(limit));

    const result = await PackageModel.query(query, params);
    let packages = result.rows;
    
    console.log('🔍 Debug packages query result:', {
      queryLength: packages.length,
      firstPackage: packages[0] ? {
        id: packages[0].id?.slice(0,8),
        customer_name: packages[0].customer_name,
        city: packages[0].city,
        customer_id: packages[0].customer_id?.slice(0,8)
      } : 'No packages'
    });

    // Transform data to match frontend expectations
    const transformedPackages = packages.map((pkg: any) => ({
      id: pkg.id,
      trackingNumber: pkg.tracking_number,
      customerId: pkg.customer_id,
      customerName: pkg.customer_name,
      customerEmail: pkg.customer_email,
      shipTo: {
        name: pkg.customer_name,
        address1: pkg.address_line1,
        address2: pkg.address_line2,
        city: pkg.city,
        province: pkg.province,
        postalCode: pkg.postal_code,
        country: pkg.country
      },
      weight: pkg.weight,
      dimensions: {
        length: pkg.length,
        width: pkg.width,
        height: pkg.height
      },
      status: pkg.status || 'ready',
      shipmentStatus: pkg.status || 'ready',
      carrier: pkg.carrier,
      serviceType: pkg.service_type,
      labelUrl: pkg.label_url,
      estimatedCost: pkg.estimated_cost,
      actualCost: pkg.actual_cost,
      price: pkg.actual_cost || pkg.estimated_cost || 0,
      loadId: pkg.load_id, // From the junction table join
      loadName: pkg.load_name,
      loadVehicle: pkg.load_vehicle,
      quotedCarrier: pkg.carrier,
      quotedService: pkg.service_type,
      quotedRate: pkg.estimated_cost,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at
    }));

    // Add expected delivery dates (temporarily disabled to debug)
    const packagesWithDelivery = transformedPackages.map((pkg) => ({
      ...pkg,
      expectedDeliveryDate: null // Will be implemented later
    }));

    res.json({
      packages: packagesWithDelivery,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: packages.length,
      },
    });
  } catch (error: any) {
    console.error('Error listing packages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get package stats
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await PackageModel.getPackageStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting package stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get package details
router.get('/:id', async (req, res) => {
  try {
    const pkg = await PackageModel.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(pkg.id);
    res.json({
      package: { ...pkg, expectedDeliveryDate },
    });
  } catch (error: any) {
    console.error('Error getting package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk assign packages to load
router.post('/bulk-assign', authenticate, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { packageIds, loadId } = req.body;

    if (!packageIds || !Array.isArray(packageIds)) {
      return res.status(400).json({ error: 'packageIds array is required' });
    }

    if (!loadId) {
      return res.status(400).json({ error: 'loadId is required' });
    }

    // Assign packages to load using LoadModel
    const { LoadModel } = await import('../models/load');
    await LoadModel.assignPackages(loadId, packageIds);

    res.json({ success: true, assignedCount: packageIds.length });
  } catch (error: any) {
    console.error('Error bulk assigning packages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark package as delivered
router.post('/:id/mark-delivered', authorize('staff', 'admin', 'driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredAt, photoUrl, photoData, signature, recipientName, relationship } = req.body;
    const confirmedBy = req.user?.id || 'system';

    let finalPhotoUrl = photoUrl;

    // If photoData (base64) is provided instead of photoUrl, store it as data URL
    if (photoData && !photoUrl) {
      // In a production app, you'd want to upload this to S3 or similar storage
      // For now, we'll store the base64 data directly (not recommended for production)
      finalPhotoUrl = photoData;
    }

    const deliverySuccess = await PackageModel.markAsDelivered(id, {
      deliveredAt,
      photoUrl: finalPhotoUrl,
      signature,
      recipientName,
      relationship,
      confirmedBy,
    });

    if (!deliverySuccess) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get updated package data for notification
    const updatedPackage = await PackageModel.findById(id);
    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found after update' });
    }

    // Send delivery notification
    try {
      const customer = await CustomerModel.findById(updatedPackage.customer_id);
      if (customer) {
        await NotificationService.notifyPackageStatusChange(id, 'delivered', customer, {
          trackingNumber: updatedPackage.trackingNumber,
          deliveryConfirmation: updatedPackage.deliveryConfirmation,
        });
      }
    } catch (notificationError) {
      console.error('Failed to send delivery notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ success: true, package: updatedPackage });
  } catch (error: any) {
    console.error('Error marking package as delivered:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update package (staff only)
router.put('/:id', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate required fields if creating from scratch
    if (updates.customerId || updates.shipTo) {
      if (!updates.customerId && !updates.shipTo?.name) {
        return res.status(400).json({ error: 'customerId and shipTo.name are required' });
      }
    }

    const updatedPackage = await PackageModel.update(id, updates);

    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: updatedPackage });
  } catch (error: any) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create package (staff only)
router.post('/', authenticate, authorize('staff', 'admin'), async (req, res) => {
  try {
    const packageData = req.body;
    const newPackage = await PackageModel.create(packageData);
    res.json({ package: newPackage });
  } catch (error: any) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get shipping quotes
router.post('/:id/quote', authorize('staff', 'admin'), async (req, res) => {
  res.json({ quotes: [] });
});

// Purchase label
router.post('/:id/purchase-label', authorize('staff', 'admin'), async (req, res) => {
  res.json({ labelUrl: 'https://s3.amazonaws.com/...' });
});

// Charge customer (now using PayPal)
router.post('/:id/charge', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get package details
    const packageData = await PackageModel.findById(id);
    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get customer details
    const customer = await CustomerModel.findById(packageData.customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Create PayPal payment link
    const payment = await PayPalService.createOrder(
      15.0,
      `Shipping for package ${packageData.barcode}`,
      packageData.id
    );

    // Update package with payment info
    await PackageModel.update(id, {
      paypalOrderId: payment.orderId,
      paymentStatus: 'pending',
      paymentUrl: payment.approveUrl,
      shipping_cost: 15.0,
    });

    res.json({
      success: true,
      paymentUrl: payment.approveUrl,
      orderId: payment.orderId,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Capture PayPal payment
router.post('/:id/capture-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;

    // Capture the payment
    const result = await PayPalService.captureOrder(orderId);

    // Update package payment status
    await PackageModel.update(id, {
      paymentStatus: 'paid',
      paypalTransactionId: result.transactionId,
      paidAt: new Date(),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Package consolidation endpoints
router.post(
  '/:id/consolidate/:parentId',
  authenticate,
  authorize('admin', 'staff'),
  async (req, res, next) => {
    try {
      const { id: childId, parentId } = req.params;

      const success = await PackageModel.addToParentPackage(childId, parentId);

      if (success) {
        res.json({
          message: 'Package consolidated successfully',
          childId,
          parentId,
        });
      } else {
        res.status(400).json({ error: 'Failed to consolidate package' });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id/consolidate',
  authenticate,
  authorize('admin', 'staff'),
  async (req, res, next) => {
    try {
      const { id: childId } = req.params;

      // Get the current package to find its parent
      const currentPackage = await PackageModel.findById(childId);
      if (!currentPackage || !currentPackage.parent_package_id) {
        return res.status(404).json({ error: 'Package not found or not consolidated' });
      }
      
      const success = await PackageModel.removeFromParentPackage(childId, currentPackage.parent_package_id);

      if (success) {
        res.json({
          message: 'Package removed from consolidation successfully',
          packageId: childId,
        });
      } else {
        res.status(400).json({ error: 'Failed to remove package from consolidation' });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/relationships',
  authenticate,
  authorize('admin', 'staff'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const packageWithRelationships = await PackageModel.getPackageWithRelationships(id);

      if (packageWithRelationships) {
        res.json(packageWithRelationships);
      } else {
        res.status(404).json({ error: 'Package not found' });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get packages by load ID
router.get(
  '/by-load/:loadId',
  authenticate,
  authorize('admin', 'staff'),
  async (req, res, next) => {
    try {
      const { loadId } = req.params;

      // Import LoadModel to get package IDs for this load
      const { LoadModel } = await import('../models/load');
      const packageIds = await LoadModel.getPackages(loadId);

      // Get all package details
      const packages = [];
      for (const packageId of packageIds) {
        const pkg = await PackageModel.findByIdWithAddress(packageId);
        if (pkg) {
          packages.push(pkg);
        }
      }

      res.json({
        success: true,
        loadId,
        packages,
        count: packages.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all packages - filtered by permissions
router.get('/', 
  authenticate,
  checkCASLPermission({ action: 'read', resource: 'Package' }),
  async (req: any, res, next) => {
    try {
      // Get packages filtered by user permissions
      const userRole = req.user?.role;
      const userId = req.user?.id;
      const customerId = req.user?.customerId;
      
      let packages;
      if (userRole === 'customer') {
        // Customers see only their packages
        packages = await PackageModel.findAllWithPermissionFilter(customerId, userRole);
      } else {
        // Staff/admin see all packages
        packages = await PackageModel.findAll();
      }
      
      const filteredPackages = packages;
      
      res.json({
        success: true,
        packages: filteredPackages,
        count: filteredPackages.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create package - staff only
router.post('/',
  authenticate,
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'create', resource: 'Package' }),
  async (req: any, res, next) => {
    try {
      const packageData = req.body;
      
      // Create the package
      const newPackage = await PackageModel.create(packageData);
      
      res.status(201).json({
        success: true,
        package: newPackage
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
