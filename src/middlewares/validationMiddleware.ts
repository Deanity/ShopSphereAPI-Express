import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (schema.shape.body) req.body = parsed.body;
      if (schema.shape.query) req.query = parsed.query;
      if (schema.shape.params) req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.issues));
      } else {
        next(error);
      }
    }
  };
};
