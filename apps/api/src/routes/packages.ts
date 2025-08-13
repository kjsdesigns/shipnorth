import { Router } from 'express';
import { authorize } from '../middleware/auth';

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

// Charge customer
router.post('/:id/charge', authorize('staff', 'admin'), async (req, res) => {
  res.json({ success: true });
});

export default router;