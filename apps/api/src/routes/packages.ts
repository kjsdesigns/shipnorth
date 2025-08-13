import { Router } from 'express';
import { authorize } from '../middleware/auth';
import PayPalService from '../services/paypal';
import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';

const router = Router();

// List packages
router.get('/', async (req, res) => {
  res.json({ packages: [] });
});

// Get package details
router.get('/:id', async (req, res) => {
  res.json({ package: { id: req.params.id } });
});

// Create package (staff only)
router.post('/', authorize('staff', 'admin'), async (req, res) => {
  res.json({ package: { id: '123', ...req.body } });
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
      transactionId: result.transactionId,
      ...result,
    });
  } catch (error: any) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;