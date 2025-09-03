import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../services/audit-logger';

// Middleware to comprehensively log all API activity
export function auditAllRequests() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // Log all authenticated requests
    if (user && (req.method !== 'GET' || req.path.includes('/admin'))) {
      AuditLogger.log({
        userId: user.id,
        action: req.method.toLowerCase(),
        resource: req.path.split('/')[1] || 'unknown',
        resourceId: req.params.id,
        details: {
          endpoint: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      }).catch(err => console.error('Audit logging failed:', err));
    }
    
    next();
  };
}