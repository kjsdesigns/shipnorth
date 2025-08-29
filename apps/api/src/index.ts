import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import routers
import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import packagesRouter from './routes/packages';
import loadsRouter from './routes/loads';
import invoicesRouter from './routes/invoices';
import webhooksRouter from './routes/webhooks';
import adminRouter from './routes/admin';
import searchRouter from './routes/search';
import routeOptimizationRouter from './routes/route-optimization';
import testRouteRouter from './routes/test-route';
import gpsTrackingRouter from './routes/gps-tracking';
import packageScanningRouter from './routes/package-scanning';
import driverMediaRouter from './routes/driver-media';
import offlineSyncRouter from './routes/offline-sync';
import aiRouteGenerationRouter from './routes/ai-route-generation';
import driverAssignmentRouter from './routes/driver-assignment';
import enhancedRegistrationRouter from './routes/enhanced-registration';
// import settingsRouter from './routes/settings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate, authorize } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// Global rate limiter - 200 req/min per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Serve documentation
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Serve plan markdown files
app.get('/plans/:file', (req, res) => {
  const planPath = path.join(__dirname, '..', '..', '..', 'plans', req.params.file);
  if (fs.existsSync(planPath)) {
    res.sendFile(planPath);
  } else {
    res.status(404).json({ error: 'Plan not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/auth', authRouter);
app.use('/webhooks', webhooksRouter);
app.use('/registration', enhancedRegistrationRouter);

// Mixed routes (some public, some protected) - authentication handled per route
app.use('/customers', customersRouter);
app.use('/packages', packagesRouter);
app.use('/loads', authenticate, authorize('admin', 'staff'), loadsRouter);
app.use('/invoices', authenticate, invoicesRouter);
app.use('/admin', authenticate, adminRouter);
app.use('/search', authenticate, searchRouter);
app.use('/routes', authenticate, authorize('admin', 'staff'), routeOptimizationRouter);
app.use('/test', authenticate, testRouteRouter);

// Driver-specific routes
app.use('/gps', authenticate, authorize('driver', 'staff', 'admin'), gpsTrackingRouter);
app.use('/scanning', authenticate, authorize('driver', 'staff', 'admin'), packageScanningRouter);
app.use('/media', authenticate, authorize('driver', 'staff', 'admin'), driverMediaRouter);
app.use('/sync', authenticate, authorize('driver', 'staff', 'admin'), offlineSyncRouter);

// AI Route generation (staff and drivers)
app.use('/ai-routes', authenticate, authorize('staff', 'driver', 'admin'), aiRouteGenerationRouter);

// Driver assignment (staff only)
app.use('/driver-assignment', authenticate, authorize('staff', 'admin'), driverAssignmentRouter);

// app.use('/settings', authenticate, settingsRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
