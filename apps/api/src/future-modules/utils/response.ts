import { Response } from 'express';
import { ApiResponse, ERROR_CODES } from '@shipnorth/shared';

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, pagination?: any): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      pagination,
    };
    res.json(response);
  }

  static created<T>(res: Response, data: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || 'Resource created successfully',
    };
    res.status(201).json(response);
  }

  static error(
    res: Response, 
    statusCode: number, 
    error: string, 
    errorCode?: string,
    details?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      error,
      ...(errorCode && { errorCode }),
      ...(details && { details }),
    };
    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, error: string, details?: any): void {
    this.error(res, 400, error, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(res: Response, error: string = 'Unauthorized'): void {
    this.error(res, 401, error, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(res: Response, error: string = 'Forbidden'): void {
    this.error(res, 403, error, ERROR_CODES.FORBIDDEN);
  }

  static notFound(res: Response, error: string = 'Resource not found'): void {
    this.error(res, 404, error, ERROR_CODES.NOT_FOUND);
  }

  static conflict(res: Response, error: string): void {
    this.error(res, 409, error, ERROR_CODES.CONFLICT);
  }

  static internalError(res: Response, error: string = 'Internal server error'): void {
    this.error(res, 500, error, ERROR_CODES.INTERNAL_ERROR);
  }

  static rateLimited(res: Response, error: string = 'Rate limit exceeded'): void {
    this.error(res, 429, error, ERROR_CODES.RATE_LIMITED);
  }

  // Validation error helper
  static validationError(res: Response, errors: Array<{ field: string; message: string }>): void {
    this.badRequest(res, 'Validation failed', { errors });
  }

  // Pagination helper
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): void {
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };

    this.success(res, data, message, pagination);
  }
}

// Async wrapper for route handlers
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error handling middleware enhancement
export function handleServiceError(error: any, res: Response): void {
  console.error('Service error:', error);

  switch (error.message) {
    case 'CUSTOMER_EXISTS':
      ResponseHelper.conflict(res, 'Customer already exists');
      break;
    case 'INVALID_CREDENTIALS':
      ResponseHelper.unauthorized(res, 'Invalid credentials');
      break;
    case 'INSUFFICIENT_PERMISSIONS':
      ResponseHelper.forbidden(res, 'Insufficient permissions');
      break;
    case 'VALIDATION_FAILED':
      ResponseHelper.validationError(res, error.details || []);
      break;
    default:
      if (error.message.includes('not found')) {
        ResponseHelper.notFound(res, error.message);
      } else if (error.message.includes('already assigned')) {
        ResponseHelper.conflict(res, error.message);
      } else {
        ResponseHelper.internalError(res, error.message);
      }
  }
}