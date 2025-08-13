import { Router } from 'express';
import { authorize } from '../middleware/auth';

const router = Router();

// List customers (staff only)
router.get('/', authorize('staff', 'admin'), async (req, res) => {
  res.json({ customers: [] });
});

// Get customer details
router.get('/:id', async (req, res) => {
  res.json({ customer: { id: req.params.id } });
});

// Create customer (staff only)
router.post('/', authorize('staff', 'admin'), async (req, res) => {
  res.json({ customer: { id: '123', ...req.body } });
});

// Create Stripe setup session
router.post('/:id/setup-payment', authorize('staff', 'admin'), async (req, res) => {
  res.json({ setupUrl: 'https://checkout.stripe.com/...' });
});

export default router;