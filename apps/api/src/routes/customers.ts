import { Router } from 'express';
import SessionAuth from '../middleware/session-auth';
import { authorize, AuthRequest } from '../middleware/auth';
import { checkCASLPermission, requireCASLPortalAccess } from '../middleware/casl-permissions';
import { CustomerModel } from '../models/customer';
import paypalService from '../services/paypal';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// List all customers (staff/admin only)
router.get('/', 
  SessionAuth.requireAuth(['staff', 'admin']), 
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'read', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
  try {
    console.log('🎯 Customers API called');
    const customers = await CustomerModel.list();
    console.log('📊 CustomerModel.list returned:', customers.length, 'customers');
    console.log('🔍 First customer:', customers[0] ? {
      name: customers[0].name,
      addressLine1: customers[0].addressLine1,
      city: customers[0].city
    } : 'No customers');
    
    // Add package counts for each customer
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        const packageCountResult = await CustomerModel.query(
          'SELECT COUNT(*) as count FROM packages WHERE customer_id = $1',
          [customer.id]
        );
        const packageCount = parseInt(packageCountResult.rows[0]?.count || '0');
        
        return {
          ...customer,
          packageCount
        };
      })
    );
    
    res.json({ customers: customersWithCounts });
  } catch (error) {
    next(error);
  }
});

// Self-registration endpoint (public) - Creates both customer and user account
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
      password = 'temp123', // Default password for customers
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

    // Also check if user account exists
    const { UserModel } = await import('../models/user');
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User account already exists',
        message: 'An account with this email already exists. Please sign in instead.',
        loginSuggested: true,
        email: email,
      });
    }

    // Create customer record first
    const customerData: any = {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      province,
      postalCode,
      country,
      status: 'active',
    };

    // Only add optional fields if they have values
    if (addressLine2) customerData.addressLine2 = addressLine2;

    const customer = await CustomerModel.create(customerData);

    // Create user account linked to customer
    const userData = {
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'customer' as const,
      customerId: customer.id,
    };

    const user = await UserModel.create(userData);

    // Generate authentication tokens
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: customer.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      customerId: customer.id,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        customerId: customer.id,
      },
      accessToken,
      refreshToken,
      message: 'Registration successful. You are now logged in.',
    });
  } catch (error) {
    next(error);
  }
});

// Create vault order for inline card collection
router.post('/create-vault-order', async (req, res, next) => {
  try {
    const { customerId } = req.body;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // For development/demo, return a mock order ID (only if PayPal credentials missing)
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      res.json({
        orderId: `MOCK_ORDER_${Date.now()}`,
        status: 'CREATED',
      });
      return;
    }

    const vaultOrder = await paypalService.createVaultOrder({
      email: customer.email || '',
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      phone: customer.phone || '',
    });

    res.json({
      orderId: vaultOrder.orderId,
      status: vaultOrder.status,
    });
  } catch (error) {
    next(error);
  }
});

// Complete payment method setup with vault order
router.post('/complete-payment-method', async (req, res, next) => {
  try {
    const { customerId, orderId } = req.body;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // For development/demo, return mock payment method data (only if PayPal credentials missing)
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      const mockPaymentMethod = {
        last4: '1234',
        brand: 'visa',
        expiryMonth: '12',
        expiryYear: '2027',
        type: 'CARD' as const,
        token: `MOCK_TOKEN_${Date.now()}`,
      };

      // Update customer with mock payment method details
      await CustomerModel.update(customerId, {
        paymentMethod: mockPaymentMethod,
      });

      res.json({
        success: true,
        paymentMethod: mockPaymentMethod,
        message: 'Payment method added successfully',
      });
      return;
    }

    // Capture the vault order to get the payment token and card details
    const vaultResult = await paypalService.captureVaultOrder(orderId);

    // Update customer with payment method details
    const paymentMethod = {
      ...vaultResult.paymentSource.card,
      type: 'CARD' as const,
    };

    await CustomerModel.update(customerId, {
      paymentMethod,
    });

    res.json({
      success: true,
      paymentMethod,
      message: 'Payment method added successfully',
    });
  } catch (error) {
    console.error('Payment method completion error:', error);
    next(error);
  }
});

// Process payment using stored token
router.post('/process-payment', async (req, res, next) => {
  try {
    const { customerId, amount, description, referenceId } = req.body;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    if (!customer.paymentMethod || typeof customer.paymentMethod === 'string' || !customer.paymentMethod.token) {
      throw new AppError(400, 'No payment method available');
    }

    // For development/demo, return mock transaction data (only if PayPal credentials missing)
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      const mockTransaction = {
        orderId: `MOCK_ORDER_${Date.now()}`,
        transactionId: `MOCK_TXN_${Date.now()}`,
        status: 'COMPLETED',
        amount: parseFloat(amount.toString()),
        currency: 'CAD',
        payerEmail: customer.email,
        payerName: `${customer.firstName} ${customer.lastName}`,
      };

      res.json({
        success: true,
        transaction: mockTransaction,
        message: 'Payment processed successfully',
      });
      return;
    }

    const paymentResult = await paypalService.processPaymentWithToken(
      (customer.paymentMethod as any).token,
      amount,
      description,
      referenceId
    );

    res.json({
      success: true,
      transaction: paymentResult,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Complete registration with payment method
router.post('/complete-registration', async (req, res, next) => {
  try {
    const { customerId, setupTokenId } = req.body;

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Create PayPal payment token from approved setup token
    const paymentToken = await paypalService.createPaymentToken(setupTokenId);

    if (!paymentToken.paymentTokenId) {
      throw new AppError(400, 'Payment method setup not completed');
    }

    // Update customer with payment method
    await CustomerModel.update(customerId, {
      paypalPaymentTokenId: paymentToken.paymentTokenId,
    });

    res.json({
      message: 'Registration completed successfully',
      customer: await CustomerModel.findById(customerId),
    });
  } catch (error) {
    next(error);
  }
});

// CSV import endpoint (staff only)
router.post('/import', SessionAuth.requireAuth(), requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'create', resource: 'Customer' }), async (req, res, next) => {
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
          // Create new customer (PayPal setup will be done during registration)
          await CustomerModel.create({
            ...customerData,
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

// Search customers (staff only)
router.get(
  '/search',
  SessionAuth.requireAuth(),
  requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.json({ customers: [] });
      }

      const customers = await CustomerModel.search(q as string);
      res.json({ customers });
    } catch (error) {
      next(error);
    }
  }
);

// List customers (staff only)
router.get('/', SessionAuth.requireAuth(), requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }), async (req: AuthRequest, res, next) => {
  try {
    const customers = await CustomerModel.list();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

// Get customer details
router.get(
  '/:id',
  SessionAuth.requireAuth(),
  requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
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
  }
);

// Get individual customer by ID
router.get('/:id', SessionAuth.requireAuth(), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    // Check access permissions
    if (req.user?.role === 'customer' && (req.user as any).customerId !== id) {
      throw new AppError(403, 'Access denied');
    }
    
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
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
router.post('/', requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }), async (req: AuthRequest, res, next) => {
  try {
    const customer = await CustomerModel.create(req.body);
    res.status(201).json({ customer });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate required fields if creating from scratch
    if (updates.email) {
      if (!updates.firstName || !updates.lastName) {
        throw new AppError(400, 'firstName and lastName are required when updating email');
      }
    }

    const customer = await CustomerModel.update(id, updates);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// Create Stripe setup session (mock for now)
router.post(
  '/:id/setup-payment',
  requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
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
  }
);

// Delete customer (admin only)
router.delete('/:id', requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'delete', resource: 'Customer' }), async (req: AuthRequest, res, next) => {
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

// Get customer payment methods
router.get(
  '/:id/payment-methods',
  SessionAuth.requireAuth(),
  requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const customer = await CustomerModel.findById(id);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Get current payment method details if token exists
      let paymentMethods = [];
      if (customer.paypalPaymentTokenId) {
        try {
          const paymentMethod = await paypalService.getPaymentMethodDetails(
            customer.paypalPaymentTokenId
          );
          if (paymentMethod) {
            paymentMethods.push({
              ...paymentMethod,
              isDefault: true,
            });
          }
        } catch (error) {
          console.error('Error getting payment method details:', error);
          // Continue without payment method details - PayPal might not be configured
        }
      }

      res.json({
        paymentMethods,
        customerId: id,
        hasPayPalSetup: !!customer.paypalCustomerId,
        hasPaymentToken: !!customer.paypalPaymentTokenId,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Replace customer payment method
router.post('/:id/payment-methods/replace', requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }), async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Create new setup token for payment method replacement
    const setupToken = await paypalService.createCustomerSetupToken({
      email: customer.email || '',
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      phone: customer.phone || '',
    });

    res.json({
      setupTokenId: setupToken.setupTokenId,
      approveUrl: setupToken.approveUrl,
      message: 'Payment method replacement initiated',
    });
  } catch (error) {
    next(error);
  }
});

// Complete payment method replacement
router.post(
  '/:id/payment-methods/complete-replacement',
  requireCASLPortalAccess('staff'), checkCASLPermission({ action: 'manage', resource: 'Customer' }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { setupTokenId } = req.body;

      const customer = await CustomerModel.findById(id);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Delete old payment method if exists
      if (customer.paypalPaymentTokenId) {
        try {
          await paypalService.deletePaymentToken(customer.paypalPaymentTokenId);
        } catch (error) {
          console.error('Failed to delete old payment method:', error);
          // Continue with new payment method creation
        }
      }

      // Create new payment token
      const paymentToken = await paypalService.createPaymentToken(setupTokenId);

      if (!paymentToken.paymentTokenId) {
        throw new AppError(400, 'Payment method replacement failed');
      }

      // Update customer record
      await CustomerModel.update(id, {
        paypalPaymentTokenId: paymentToken.paymentTokenId,
      });

      res.json({
        message: 'Payment method replaced successfully',
        customer: await CustomerModel.findById(id),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Customer self-service payment method endpoints
router.get(
  '/me/payment-methods',
  SessionAuth.requireAuth(),
  checkCASLPermission({ action: 'read', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
    try {
      let customerId = req.user?.customerId;

      // If customerId not in token, find customer by user ID
      if (!customerId) {
        const customerByUserId = await CustomerModel.findByEmail(req.user!.email);
        if (!customerByUserId) {
          throw new AppError(404, 'Customer record not found');
        }
        customerId = customerByUserId.id;
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Get current payment method details if token exists
      let paymentMethods = [];
      if (customer.paypalPaymentTokenId) {
        try {
          const paymentMethod = await paypalService.getPaymentMethodDetails(
            customer.paypalPaymentTokenId
          );
          if (paymentMethod) {
            paymentMethods.push({
              ...paymentMethod,
              isDefault: true,
            });
          }
        } catch (error) {
          console.error('PayPal error for customer payment methods:', error);
          // Continue without payment method details
        }
      }

      res.json({
        paymentMethods,
        customerId,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Customer replace their own payment method
router.post(
  '/me/payment-methods/replace',
  checkCASLPermission({ action: 'read', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) {
        throw new AppError(400, 'Customer ID not found in token');
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Create new setup token for payment method replacement
      const setupToken = await paypalService.createCustomerSetupToken({
        email: customer.email || '',
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        phone: customer.phone || '',
      });

      res.json({
        setupTokenId: setupToken.setupTokenId,
        approveUrl: setupToken.approveUrl,
        message: 'Payment method replacement initiated',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Customer complete payment method replacement
router.post(
  '/me/payment-methods/complete-replacement',
  checkCASLPermission({ action: 'read', resource: 'Customer' }),
  async (req: AuthRequest, res, next) => {
    try {
      const customerId = req.user?.customerId;
      const { setupTokenId } = req.body;

      if (!customerId) {
        throw new AppError(400, 'Customer ID not found in token');
      }

      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Delete old payment method if exists
      if (customer.paypalPaymentTokenId) {
        try {
          await paypalService.deletePaymentToken(customer.paypalPaymentTokenId);
        } catch (error) {
          console.error('Failed to delete old payment method:', error);
          // Continue with new payment method creation
        }
      }

      // Create new payment token
      const paymentToken = await paypalService.createPaymentToken(setupTokenId);

      if (!paymentToken.paymentTokenId) {
        throw new AppError(400, 'Payment method replacement failed');
      }

      // Update customer record
      await CustomerModel.update(customerId, {
        paypalPaymentTokenId: paymentToken.paymentTokenId,
      });

      res.json({
        message: 'Payment method replaced successfully',
        customer: await CustomerModel.findById(customerId),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
