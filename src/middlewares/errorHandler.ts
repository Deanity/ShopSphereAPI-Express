import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

interface MongooseCastError extends Error {
  path: string;
  value: string;
}

interface MongooseValidationError extends Error {
  errors: Record<string, { path: string; message: string }>;
}

interface MongooseDuplicateKeyError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

export const errorHandler = (
  err: Error & Partial<MongooseCastError & MongooseValidationError & MongooseDuplicateKeyError>,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response | void => {
  // 1. Centralized AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || [],
    });
  }

  // 2. Mongoose CastError (invalid ID)
  if (err.name === 'CastError' && 'path' in err) {
    return res.status(400).json({
      success: false,
      message: `Invalid value for path: ${err.path}`,
      code: 'INVALID_ID',
      errors: [],
    });
  }

  // 3. Mongoose ValidationError
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Database validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // 4. Mongoose duplicate key error (code 11000)
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate field value: ${field}. Please use another value.`,
      code: 'DUPLICATE_KEY_ERROR',
      errors: [],
    });
  }

  // 5. JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid access token',
      code: 'INVALID_TOKEN',
      errors: [],
    });
  }

  // 6. JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Access token has expired',
      code: 'TOKEN_EXPIRED',
      errors: [],
    });
  }

  // 7. Unknown errors
  console.error('💥 Unhandled internal error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    errors: [],
  });
};
