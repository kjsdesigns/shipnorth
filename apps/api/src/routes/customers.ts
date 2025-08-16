import { Router } from 'express';
import { authorize, AuthRequest } from '../middleware/auth';
import { CustomerModel } from '../models/customer';
import { StripeService } from '../services/stripe';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Self-registration endpoint (public)
router.post('/register', async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country = 'CA',
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await CustomerModel.findByEmail(email);
    if (existingCustomer) {
      return res.status(409).json({
        error: 'Customer already exists',
        message: 'An account with this email already exists. Please sign in instead.',
        loginSuggested: true,
        email: email,
      });
    }

    // Create Stripe customer
    const stripeCustomer = await StripeService.createCustomer({
      email,
      name: `${firstName} ${lastName}`,
      phone,
      address: {
        line1: addressLine1,
        line2: addressLine2,
        city,
        state: province,
        postal_code: postalCode,
        country,
      },
    });

    // Create setup intent for payment method
    const setupIntent = await StripeService.createSetupIntent(stripeCustomer.id);

    // Create customer record
    const customer = await CustomerModel.create({
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
      stripeCustomerId: stripeCustomer.id,
      status: 'active',
    });

    res.status(201).json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      setupIntent: {
        client_secret: setupIntent.client_secret,
        id: setupIntent.id,
      },
      message: 'Registration successful. Please add a payment method to complete setup.',
    });
  } catch (error) {
    next(error);
  }
});

// Complete registration with payment method
router.post('/complete-registration', async (req, res, next) => {
  try {
    const { customerId, setupIntentId } = req.body;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Retrieve setup intent from Stripe
    const setupIntent = await StripeService.stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      throw new AppError(400, 'Payment method setup not completed');
    }

    // Update customer with payment method
    await CustomerModel.update(customerId, {
      stripePaymentMethodId: setupIntent.payment_method as string,
    });

    // Set as default payment method
    if (customer.stripeCustomerId) {
      await StripeService.setDefaultPaymentMethod(
        customer.stripeCustomerId,
        setupIntent.payment_method as string
      );
    }

    res.json({
      message: 'Registration completed successfully',
      customer: await CustomerModel.findById(customerId),
    });
  } catch (error) {
    next(error);
  }
});

// CSV import endpoint (staff only)
router.post('/import', authorize('staff', 'admin'), async (req, res, next) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers)) {
      throw new AppError(400, 'Invalid CSV data format');
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    for (const customerData of customers) {
      try {
        const existingCustomer = await CustomerModel.findByEmail(customerData.email);
        
        if (existingCustomer) {
          // Update existing customer
          await CustomerModel.update(existingCustomer.id, customerData);
          results.updated++;
        } else {
          // Create new customer
          const stripeCustomer = await StripeService.createCustomer({
            email: customerData.email,
            name: `${customerData.firstName} ${customerData.lastName}`,
            phone: customerData.phone,
            address: {
              line1: customerData.addressLine1,
              line2: customerData.addressLine2,
              city: customerData.city,
              state: customerData.province,
              postal_code: customerData.postalCode,
              country: customerData.country || 'CA',
            },
          });

          await CustomerModel.create({
            ...customerData,
            stripeCustomerId: stripeCustomer.id,
            status: 'active',
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          email: customerData.email,
          error: error.message,
        });
      }
    }

    res.json({
      message: 'Import completed',
      results,
    });
  } catch (error) {
    next(error);
  }
});

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