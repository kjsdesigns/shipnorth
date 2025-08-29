import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [decoded.role], // Handle both new and legacy formats
      role: decoded.role || (decoded.roles && decoded.roles[0]), // Legacy compatibility
      customerId: decoded.customerId,
      lastUsedPortal: decoded.lastUsedPortal,
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
