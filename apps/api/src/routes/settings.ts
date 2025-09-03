import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { checkCASLPermission, requireCASLPortalAccess } from '../middleware/casl-permissions';
import { SettingsModel } from '../models/settings';

const router = Router();

// Get system settings
router.get('/', 
  authenticate,
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'read', resource: 'Settings' }),
  async (req, res) => {
  try {
    const settings = await SettingsModel.get();
    res.json({ settings });
  } catch (error: any) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update system settings
router.put('/', 
  authenticate,
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'manage', resource: 'Settings' }),
  async (req, res) => {
  try {
    const updates = req.body;
    const settings = await SettingsModel.update(updates);
    res.json({ settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get default origin address
router.get('/origin-address', authorize('staff', 'admin'), async (req, res) => {
  try {
    const address = await SettingsModel.getDefaultOriginAddress();
    res.json({ address });
  } catch (error: any) {
    console.error('Error getting origin address:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update default origin address
router.put('/origin-address', authorize('admin'), async (req, res) => {
  try {
    const address = req.body;
    await SettingsModel.updateDefaultOriginAddress(address);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating origin address:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
