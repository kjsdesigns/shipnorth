import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // TODO: Fetch user from database
    // For now, mock user
    const user = {
      id: '123',
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10),
      role: 'staff',
    };
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
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
    
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
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
    
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'development-refresh-secret'
    ) as any;
    
    // TODO: Fetch user from database
    const user = { id: decoded.id, email: 'test@example.com', role: 'staff' };
    
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

export default router;