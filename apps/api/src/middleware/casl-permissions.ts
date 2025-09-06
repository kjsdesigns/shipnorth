import { Request, Response, NextFunction } from 'express';
import { defineAbilityFor, canAccessPortal } from '../auth/casl-ability';
import { ForbiddenError } from '@casl/ability';
// Audit logger removed - enhanced feature

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
        
        // Audit logging removed - enhanced feature

        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
          details: errorMessage
        });
      }
      
      // Attach ability to request for use in controllers
      req.ability = ability;
      
      // Audit logging removed - enhanced feature
      
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
      // Audit logging removed - enhanced feature

      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have access to the ${portal} portal`
      });
    }
    
    next();
  };
}