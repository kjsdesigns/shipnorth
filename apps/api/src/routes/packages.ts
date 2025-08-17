/// <reference path="../types/express.d.ts" />
import { Router } from 'express';
import { authorize } from '../middleware/auth';
import PayPalService from '../services/paypal';
import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';
import { NotificationService } from '../services/notifications';

const router = Router();

// List packages
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    let packages;
    if (status) {
      packages = await PackageModel.getPackagesByLoadStatus(status as string);
    } else {
      packages = await PackageModel.list(Number(limit));
    }
    
    // Add expected delivery dates
    const packagesWithDelivery = await Promise.all(
      packages.map(async (pkg) => {
        const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(pkg.id);
        return { ...pkg, expectedDeliveryDate };
      })
    );
    
    res.json({ 
      packages: packagesWithDelivery,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: packages.length
      }
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
      package: { ...pkg, expectedDeliveryDate }
    });
  } catch (error: any) {
    console.error('Error getting package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk assign packages to load
router.post('/bulk-assign', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { packageIds, loadId } = req.body;
    
    if (!packageIds || !Array.isArray(packageIds)) {
      return res.status(400).json({ error: 'packageIds array is required' });
    }
    
    if (!loadId) {
      return res.status(400).json({ error: 'loadId is required' });
    }
    
    // Update each package with the load assignment
    for (const packageId of packageIds) {
      await PackageModel.update(packageId, { loadId });
    }
    
    res.json({ success: true, assignedCount: packageIds.length });
  } catch (error: any) {
    console.error('Error bulk assigning packages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark package as delivered
router.post('/:id/mark-delivered', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredAt, photoUrl, signature, recipientName, relationship } = req.body;
    const confirmedBy = req.user?.id || 'system';
    
    const updatedPackage = await PackageModel.markAsDelivered(id, {
      deliveredAt,
      photoUrl,
      signature,
      recipientName,
      relationship,
      confirmedBy,
    });
    
    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Send delivery notification
    try {
      const customer = await CustomerModel.findById(updatedPackage.customerId);
      if (customer) {
        await NotificationService.notifyPackageStatusChange(
          id,
          'delivered',
          customer,
          {
            trackingNumber: updatedPackage.trackingNumber,
            deliveryConfirmation: updatedPackage.deliveryConfirmation,
          }
        );
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

// Create package (staff only)
router.post('/', authorize('staff', 'admin'), async (req, res) => {
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
    const packageData = await PackageModel.get(id);
    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    // Get customer details
    const customer = await CustomerModel.get(packageData.customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Create PayPal payment link
    const payment = await PayPalService.createPaymentLink(packageData, customer);
    
    // Update package with payment info
    await PackageModel.update(id, {
      paypalOrderId: payment.orderId,
      paymentStatus: 'pending',
      paymentUrl: payment.paymentUrl,
      shippingCost: payment.amount,
    });
    
    res.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      orderId: payment.orderId,
      amount: payment.amount,
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
      paidAt: new Date().toISOString(),
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

export default router;