import { Router } from 'express';
import { authorize, AuthRequest } from '../middleware/auth';
import { CustomerModel } from '../models/customer';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// List customers (staff only)
router.get('/', authorize('staff', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const customers = await CustomerModel.list();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

// Get customer details
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    
    // Check access - customers can only see their own data
    if (req.user?.role === 'customer' && (req.user as any).customerId !== req.params.id) {
      throw new AppError(403, 'Access denied');
    }
    
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// Get customer packages
router.get('/:id/packages', async (req: AuthRequest, res, next) => {
  try {
    // Check access
    if (req.user?.role === 'customer' && (req.user as any).customerId !== req.params.id) {
      throw new AppError(403, 'Access denied');
    }
    
    const packages = await CustomerModel.getPackages(req.params.id);
    res.json({ packages });
  } catch (error) {
    next(error);
  }
});

// Get customer invoices
router.get('/:id/invoices', async (req: AuthRequest, res, next) => {
  try {
    // Check access
    if (req.user?.role === 'customer' && (req.user as any).customerId !== req.params.id) {
      throw new AppError(403, 'Access denied');
    }
    
    const invoices = await CustomerModel.getInvoices(req.params.id);
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
});

// Create customer (staff only)
router.post('/', authorize('staff', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const customer = await CustomerModel.create(req.body);
    res.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Check access
    if (req.user?.role === 'customer' && (req.user as any).customerId !== req.params.id) {
      throw new AppError(403, 'Access denied');
    }
    
    const customer = await CustomerModel.update(req.params.id, req.body);
    
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// Create Stripe setup session (mock for now)
router.post('/:id/setup-payment', authorize('staff', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    
    // Mock Stripe checkout session
    const setupUrl = `https://checkout.stripe.com/setup/mock_session_${Date.now()}`;
    
    // In real implementation, would create actual Stripe session
    // and save the session ID for webhook processing
    
    res.json({ setupUrl });
  } catch (error) {
    next(error);
  }
});

// Delete customer (admin only)
router.delete('/:id', authorize('admin'), async (req: AuthRequest, res, next) => {
  try {
    const success = await CustomerModel.delete(req.params.id);
    
    if (!success) {
      throw new AppError(404, 'Customer not found');
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;