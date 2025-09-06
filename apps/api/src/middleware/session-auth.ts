import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface SessionUser {
  id: string;
  email: string;
  role: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  customerId?: string;
  phone?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const SESSION_DURATION = 24 * 60 * 60; // 24 hours

/**
 * Future-Proof Session Authentication Middleware
 * Uses HTTP-only cookies with server-side validation
 */
export class SessionAuth {
  
  /**
   * Create secure session after login
   */
  static createSession(user: SessionUser, res: Response): string {
    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
      firstName: user.firstName,
      lastName: user.lastName,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const sessionToken = jwt.sign(sessionData, JWT_SECRET, {
      expiresIn: SESSION_DURATION
    });
    
    // Set HTTP-only cookie (no JavaScript access)
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'lax',
      maxAge: SESSION_DURATION * 1000,
      path: '/',
      // Remove domain to allow cookie on current domain only
      // domain: 'localhost' // This was causing cross-port issues
    });
    
    return sessionToken;
  }
  
  /**
   * Validate session from request
   */
  static validateSession(req: Request): SessionUser | null {
    try {
      // Test mode bypass
      if (process.env.NODE_ENV === 'development' && req.headers['x-test-mode'] === 'true') {
        const testRole = req.headers['x-test-role'] as string || 'staff';
        console.log(`🧪 SESSION AUTH: Test mode active for ${testRole}`);
        return {
          id: `test-${testRole}-id`,
          email: `${testRole}@shipnorth.com`,
          role: testRole,
          roles: [testRole],
          firstName: 'Test',
          lastName: testRole.charAt(0).toUpperCase() + testRole.slice(1)
        };
      }
      
      const sessionCookie = req.cookies?.session;
      
      if (!sessionCookie) {
        return null;
      }
      
      const decoded = jwt.verify(sessionCookie, JWT_SECRET) as any;
      
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        roles: decoded.roles || [decoded.role],
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        customerId: decoded.customerId,
        phone: decoded.phone
      };
      
    } catch (error) {
      console.warn('Session validation failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  /**
   * Middleware to protect routes
   */
  static requireAuth(allowedRoles?: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = SessionAuth.validateSession(req);
      
      // Debug logging for authentication attempts
      console.log(`🔐 SESSION AUTH: ${req.method} ${req.path}`);
      console.log(`🍪 COOKIES: ${Object.keys(req.cookies || {}).join(', ') || 'None'}`);
      
      if (!user) {
        console.log(`❌ SESSION AUTH FAILED: No valid session for ${req.path}`);
        return res.status(401).json({ 
          error: 'Authentication required',
          redirectTo: '/login/'
        });
      }
      
      console.log(`✅ SESSION AUTH SUCCESS: User ${user.email} (${user.role}) accessing ${req.path}`);
      
      if (allowedRoles && !allowedRoles.some(role => user.roles.includes(role))) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          userRole: user.role,
          requiredRoles: allowedRoles
        });
      }
      
      // Add user to request for use in route handlers
      (req as any).user = user;
      next();
    };
  }
  
  /**
   * Clear session (logout)
   */
  static clearSession(res: Response): void {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }
}

export default SessionAuth;