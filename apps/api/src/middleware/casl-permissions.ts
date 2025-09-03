import { Request, Response, NextFunction } from 'express';
import { defineAbilityFor, canAccessPortal } from '../auth/casl-ability';
import { ForbiddenError } from '@casl/ability';
import { AuditLogger } from '../services/audit-logger';

// Extend Express Request interface to include CASL ability
declare global {
  namespace Express {
    interface Request {
      ability?: ReturnType<typeof defineAbilityFor>;
    }
  }
}

interface CASLPermissionCheckOptions {
  action: string;
  resource: string;
  getSubject?: (req: Request) => any;
}

export function checkCASLPermission(options: CASLPermissionCheckOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const ability = defineAbilityFor(user);
      const subject = options.getSubject ? options.getSubject(req) : options.resource;
      
      // Use CASL's ForbiddenError for consistent error handling
      try {
        ForbiddenError.from(ability).throwUnlessCan(options.action, subject);
      } catch (forbiddenError) {
        const errorMessage = forbiddenError instanceof Error ? forbiddenError.message : 'Permission denied';
        
        // Log failed permission check
        AuditLogger.log({
          userId: user.id,
          action: options.action,
          resource: options.resource,
          details: { 
            endpoint: req.path,
            method: req.method,
            reason: 'CASL permission denied'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          errorMessage
        });

        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
          details: errorMessage
        });
      }
      
      // Attach ability to request for use in controllers
      req.ability = ability;
      
      // Log successful permission check
      AuditLogger.log({
        userId: user.id,
        action: options.action,
        resource: options.resource,
        resourceId: options.getSubject ? JSON.stringify(options.getSubject(req)) : undefined,
        details: { 
          endpoint: req.path,
          method: req.method,
          caslEngine: true,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      }).catch(err => console.error('Audit logging failed:', err));
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireCASLPortalAccess(portal: 'staff' | 'driver' | 'customer') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!canAccessPortal(user, portal)) {
      AuditLogger.log({
        userId: user.id,
        action: 'access',
        resource: 'Portal',
        details: { 
          requestedPortal: portal,
          userRoles: (user as any).roles || [user.role],
          reason: 'Portal access denied'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: `Access denied to ${portal} portal`
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have access to the ${portal} portal`
      });
    }
    
    next();
  };
}