import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { UserModel } from '../models/user';
import { CustomerModel } from '../models/customer';

const router = Router();

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }
    
    // Validate user credentials
    const user = await UserModel.validatePassword(email, password);
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '24h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
      { expiresIn: '30d' }
    );
    
    res.json({ 
      accessToken, 
      refreshToken, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        customerId: user.customerId,
      }
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
      country 
    } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }
    
    // Create customer record first
    const customer = await CustomerModel.create({
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
      { id: user.id, email: user.email, role: user.role },
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
      }
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
router.post('/change-password', async (req, res, next) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    if (!userId || !oldPassword || !newPassword) {
      throw new AppError(400, 'All fields are required');
    }
    
    const success = await UserModel.changePassword(userId, oldPassword, newPassword);
    if (!success) {
      throw new AppError(400, 'Invalid current password');
    }
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;