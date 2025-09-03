import { Request, Response, NextFunction } from 'express';
import { SimpleACL, Action, Resource } from '../auth/simple-acl';
import { SimpleAuditService } from '../services/simple-audit';

interface PermissionCheckOptions {
  action: Action;
  resource: Resource;
  getSubject?: (req: Request) => any;
}

export function checkPermission(options: PermissionCheckOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const subject = options.getSubject ? options.getSubject(req) : undefined;
      
      if (!SimpleACL.can(user, options.action, options.resource, subject)) {
        // Log failed permission check
        SimpleAuditService.log({
          userId: user.id,
          action: options.action,
          resource: options.resource,
          details: { 
            endpoint: req.path,
            method: req.method,
            reason: 'Permission denied'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage: 'Permission denied'
        });

        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to perform this action'
        });
      }

      // Log successful permission check
      SimpleAuditService.log({
        userId: user.id,
        action: options.action,
        resource: options.resource,
        details: { 
          endpoint: req.path,
          method: req.method
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePortalAccess(portal: 'staff' | 'driver' | 'customer') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!SimpleACL.canAccessPortal(user, portal)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have access to the ${portal} portal`
      });
    }
    
    next();
  };
}

export function filterByPermissions(resource: Resource, action: Action = Action.READ) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Add filter helper to request
    (req as any).permissionFilter = (items: any[]) => {
      return items.filter(item => SimpleACL.can(user, action, resource, item));
    };
    
    next();
  };
}

// Export for convenience
export { Action, Resource } from '../auth/simple-acl';