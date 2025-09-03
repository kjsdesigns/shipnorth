import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { UserModel } from '../models/user';
import { CustomerModel } from '../models/customer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { defineAbilityFor, getAvailablePortals } from '../auth/casl-ability';
import { permissionCache } from '../services/permission-cache';
import { PortalPersistenceService } from '../services/portal-persistence';

function getDefaultPortal(user: any): string {
  const roles = user.roles || [user.role];
  if (roles.includes('admin') || roles.includes('staff')) return 'staff';
  if (roles.includes('driver')) return 'driver';
  return 'customer';
}

const router = Router();

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    // For demo purposes, create mock driver credentials
    if (userType === 'driver' && email === 'driver@shipnorth.com' && password === 'driver123') {
      const mockDriverUser = {
        id: 'driver-1',
        email: 'driver@shipnorth.com',
        role: 'driver',
        firstName: 'John',
        lastName: 'Driver',
        customerId: null,
      };

      const accessToken = jwt.sign(
        { id: mockDriverUser.id, email: mockDriverUser.email, role: mockDriverUser.role },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { id: mockDriverUser.id },
        process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
        { expiresIn: '30d' }
      );

      return res.json({
        token: accessToken, // Keep for compatibility with driver interface
        accessToken,
        refreshToken,
        user: mockDriverUser,
      });
    }

    // Validate user credentials
    const user = await UserModel.validatePassword(email, password);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Calculate portal info
    const availablePortals = UserModel.getAvailablePortals(user);
    const defaultPortal = UserModel.getDefaultPortal(user);
    const hasAdminAccess = UserModel.hasAdminAccess(user);

    // Generate tokens with new multi-role support
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles || [user.role], // Support both new and legacy formats
        role: user.role || user.roles?.[0], // Legacy compatibility
        customerId: user.customerId,
        lastUsedPortal: user.lastUsedPortal,
      },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token: accessToken, // Keep for compatibility
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles || [user.role], // New multi-role support
        role: user.role || user.roles?.[0], // Legacy compatibility
        firstName: user.firstName,
        lastName: user.lastName,
        customerId: user.customerId,
        availablePortals,
        defaultPortal,
        hasAdminAccess,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Register endpoint (for customers)
router.post('/register', async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
    } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    // Create customer record first
    const customer = await CustomerModel.create({
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country: country || 'Canada',
      status: 'active',
    });

    // Create user account
    const user = await UserModel.create({
      email,
      password,
      role: 'customer',
      customerId: customer.id,
      firstName,
      lastName,
      phone,
      status: 'active',
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, customerId: user.customerId },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        customerId: customer.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'development-refresh-secret'
      ) as any;
    } catch (error) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Fetch user from database
    const user = await UserModel.findById(decoded.id);
    if (!user || user.status !== 'active') {
      throw new AppError(401, 'User not found or inactive');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

// Change password endpoint
// Get user permissions endpoint
router.get('/permissions', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'Unauthorized');
    }

    // Check cache first for performance
    const cached = permissionCache.get(user.id);
    
    if (cached) {
      return res.json({
        ...cached,
        user: {
          ...user,
          availablePortals: cached.availablePortals,
          defaultPortal: getDefaultPortal(user)
        },
        cached: true
      });
    }

    // Generate fresh permissions
    const ability = defineAbilityFor(user);
    const availablePortals = getAvailablePortals(user);
    const currentPortal = (user as any).lastUsedPortal || getDefaultPortal(user);

    const permissionsData = {
      rules: ability.rules,
      availablePortals,
      currentPortal
    };

    // Cache for 5 minutes
    permissionCache.set(user.id, permissionsData);

    res.json({
      ...permissionsData,
      user: {
        ...user,
        availablePortals,
        defaultPortal: getDefaultPortal(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Switch portal endpoint
router.post('/switch-portal', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const { portal } = req.body;

    if (!user) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!portal || !['staff', 'driver', 'customer'].includes(portal)) {
      throw new AppError(400, 'Invalid portal specified');
    }

    const availablePortals = getAvailablePortals(user);
    if (!availablePortals.includes(portal)) {
      throw new AppError(403, `You do not have access to the ${portal} portal`);
    }

    // Update user's last used portal in database
    const updateSuccess = await PortalPersistenceService.updateLastUsedPortal(user.id, portal);
    
    if (!updateSuccess) {
      console.warn(`Failed to persist portal switch for user ${user.id}`);
    }

    const updatedUser = {
      ...user,
      lastUsedPortal: portal,
      availablePortals,
      defaultPortal: getDefaultPortal(user)
    };

    res.json({
      user: updatedUser,
      message: `Successfully switched to ${portal} portal`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      throw new AppError(400, 'All fields are required');
    }

    // First verify the old password
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    
    const bcrypt = require('bcryptjs');
    const validOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validOldPassword) {
      throw new AppError(400, 'Invalid current password');
    }

    const success = await UserModel.changePassword(userId, newPassword);
    if (!success) {
      throw new AppError(400, 'Invalid current password');
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Switch portal endpoint
router.post('/switch-portal', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { portal } = req.body;
    const userId = req.user!.id;

    // Get full user data
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Validate portal access
    if (!UserModel.canAccessPortal(user, portal)) {
      throw new AppError(403, 'Access denied to this portal');
    }

    // Update last used portal
    await UserModel.updateLastUsedPortal(userId, portal);

    res.json({
      success: true,
      portal,
      availablePortals: UserModel.getAvailablePortals(user),
      hasAdminAccess: UserModel.hasAdminAccess(user),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
