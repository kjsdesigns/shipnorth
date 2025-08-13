import { Router } from 'express';
import { authorize } from '../middleware/auth';

const router = Router();

// List loads
router.get('/', async (req, res) => {
  res.json({ loads: [] });
});

// Get load details
router.get('/:id', async (req, res) => {
  res.json({ load: { id: req.params.id } });
});

// Create load (staff only)
router.post('/', authorize('staff', 'admin'), async (req, res) => {
  res.json({ load: { id: '123', ...req.body } });
});

// Assign packages to load
router.put('/:id/assign-packages', authorize('staff', 'admin'), async (req, res) => {
  res.json({ success: true });
});

// Generate manifest
router.get('/:id/manifest', async (req, res) => {
  res.json({ manifestUrl: 'https://s3.amazonaws.com/...' });
});

// Update GPS position (driver)
router.post('/:id/gps', authorize('driver', 'staff', 'admin'), async (req, res) => {
  res.json({ success: true });
});

export default router;