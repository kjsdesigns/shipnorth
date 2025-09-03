import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkCASLPermission, requireCASLPortalAccess } from '../middleware/casl-permissions';
import { AuditLogger } from '../services/audit-logger';

const router = Router();

// Get audit logs (admin only)
router.get('/', 
  authenticate,
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'read', resource: 'AuditLog' }),
  async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await AuditLogger.getRecentLogs(parseInt(limit as string));
      
      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }
);

// Get audit statistics (admin only)
router.get('/stats',
  authenticate,
  requireCASLPortalAccess('staff'),
  checkCASLPermission({ action: 'read', resource: 'AuditLog' }),
  async (req, res) => {
    try {
      const stats = await AuditLogger.getStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error retrieving audit stats:', error);
      res.status(500).json({ error: 'Failed to retrieve audit statistics' });
    }
  }
);

export default router;