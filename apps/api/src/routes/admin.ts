import { Router } from 'express';
import { authorize } from '../middleware/auth';

const router = Router();

// All admin routes require admin role
router.use(authorize('admin'));

// Get settings
router.get('/settings', async (req, res) => {
  res.json({ settings: {} });
});

// Update settings
router.put('/settings', async (req, res) => {
  res.json({ success: true });
});

// Generate reports
router.get('/reports', async (req, res) => {
  res.json({ reports: [] });
});

// Configure carriers
router.post('/carriers', async (req, res) => {
  res.json({ success: true });
});

export default router;