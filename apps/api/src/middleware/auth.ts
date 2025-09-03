import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Helper functions for ACL integration
function getPortalsForRoles(roles: string[]): string[] {
  const portals = [];
  if (roles.includes('customer')) portals.push('customer');
  if (roles.includes('driver')) portals.push('driver');
  if (roles.includes('staff') || roles.includes('admin')) portals.push('staff');
  return portals;
}

function getDefaultPortalForRoles(roles: string[]): string {
  if (roles.includes('admin') || roles.includes('staff')) return 'staff';
  if (roles.includes('driver')) return 'driver';
  return 'customer';
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: ('staff' | 'admin' | 'driver' | 'customer')[]; // Optional for backward compatibility
    role: 'customer' | 'staff' | 'admin' | 'driver'; // Legacy field for backward compatibility
    customerId?: string;
    lastUsedPortal?: 'staff' | 'driver' | 'customer';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret') as any;

    // Create user with ACL-compatible fields
    const userRoles = decoded.roles || [decoded.role];
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: userRoles,
      role: decoded.role || userRoles[0],
      customerId: decoded.customerId,
      lastUsedPortal: decoded.lastUsedPortal
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has any of the required roles (support both new and legacy formats)
    const userRoles = req.user!.roles || [req.user!.role];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role as any));

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
