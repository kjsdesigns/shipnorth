import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'customer' | 'staff' | 'admin' | 'driver';
        email: string;
      };
    }
  }
}