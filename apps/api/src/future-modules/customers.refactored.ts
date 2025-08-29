import { Router } from 'express';
import { authorize, AuthRequest } from '../middleware/auth';
import { CustomerService } from '../services/customer.service';
import { ResponseHelper, asyncHandler, handleServiceError } from '../utils/response';
import { ValidationHelper } from '../utils/validation';

const router = Router();

// Self-registration endpoint (public)
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const validation = ValidationHelper.validateCustomerRegistration(req.body);

    if (!validation.isValid) {
      return ResponseHelper.validationError(res, validation.errors);
    }

    try {
      const result = await CustomerService.registerCustomer(req.body);
      ResponseHelper.created(res, result, result.message);
    } catch (error: any) {
      if (error.message === 'CUSTOMER_EXISTS') {
        return ResponseHelper.conflict(
          res,
          'An account with this email already exists. Please sign in instead.'
        );
      }
      handleServiceError(error, res);
    }
  })
);

// Complete registration with payment method
router.post(
  '/complete-registration',
  asyncHandler(async (req, res) => {
    const { customerId, setupIntentId } = req.body;

    if (!customerId || !setupIntentId) {
      return ResponseHelper.badRequest(res, 'customerId and setupIntentId are required');
    }

    try {
      const customer = await CustomerService.completeRegistration(customerId, setupIntentId);
      ResponseHelper.success(res, { customer }, 'Registration completed successfully');
    } catch (error: any) {
      handleServiceError(error, res);
    }
  })
);

// CSV import endpoint (staff only)
router.post(
  '/import',
  authorize('staff', 'admin'),
  asyncHandler(async (req, res) => {
    const { customers } = req.body;

    if (!Array.isArray(customers)) {
      return ResponseHelper.badRequest(res, 'Invalid CSV data format - customers array required');
    }

    const results = await CustomerService.importCustomers(customers);

    ResponseHelper.success(
      res,
      results,
      `Import completed: ${results.created} created, ${results.updated} updated`
    );
  })
);

// List customers (staff only)
router.get(
  '/',
  authorize('staff', 'admin'),
  asyncHandler(async (req, res) => {
    const { search, limit = 50 } = req.query;

    let customers;
    if (search) {
      customers = await CustomerService.searchCustomers(search as string, Number(limit));
    } else {
      const allCustomers = await CustomerService.getCustomerWithPackages(''); // Would need list method
      customers = allCustomers ? [allCustomers.customer] : []; // Placeholder
    }

    ResponseHelper.success(res, { customers });
  })
);

// Get customer details with packages
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    // Check access permissions
    if (req.user?.role === 'customer' && req.user.customerId !== req.params.id) {
      return ResponseHelper.forbidden(res, 'Access denied');
    }

    const result = await CustomerService.getCustomerWithPackages(req.params.id);

    if (!result) {
      return ResponseHelper.notFound(res, 'Customer not found');
    }

    ResponseHelper.success(res, result);
  })
);

// Get customer packages
router.get(
  '/:id/packages',
  asyncHandler(async (req: AuthRequest, res) => {
    // Check access permissions
    if (req.user?.role === 'customer' && req.user.customerId !== req.params.id) {
      return ResponseHelper.forbidden(res, 'Access denied');
    }

    const result = await CustomerService.getCustomerWithPackages(req.params.id);

    if (!result) {
      return ResponseHelper.notFound(res, 'Customer not found');
    }

    ResponseHelper.success(res, { packages: result.packages });
  })
);

// Update customer
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    // Check access permissions
    if (req.user?.role === 'customer' && req.user.customerId !== req.params.id) {
      return ResponseHelper.forbidden(res, 'Access denied');
    }

    const validation = ValidationHelper.validateCustomerRegistration({
      ...req.body,
      email: 'temp@example.com',
    });

    if (!validation.isValid) {
      return ResponseHelper.validationError(res, validation.errors);
    }

    try {
      const customer = await CustomerModel.update(req.params.id, req.body);

      if (!customer) {
        return ResponseHelper.notFound(res, 'Customer not found');
      }

      ResponseHelper.success(res, { customer }, 'Customer updated successfully');
    } catch (error: any) {
      handleServiceError(error, res);
    }
  })
);

// Delete customer (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    try {
      const success = await CustomerService.deleteCustomer(req.params.id);

      if (!success) {
        return ResponseHelper.notFound(res, 'Customer not found');
      }

      ResponseHelper.success(res, null, 'Customer deleted successfully');
    } catch (error: any) {
      handleServiceError(error, res);
    }
  })
);

// Get customer payment methods
router.get(
  '/:id/payment-methods',
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.user?.role === 'customer' && req.user.customerId !== req.params.id) {
      return ResponseHelper.forbidden(res, 'Access denied');
    }

    const paymentMethods = await CustomerService.getCustomerPaymentMethods(req.params.id);
    ResponseHelper.success(res, { paymentMethods });
  })
);

export default router;
