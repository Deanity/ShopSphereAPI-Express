import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from './checkout.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class CheckoutController {
  static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const checkoutData = await CheckoutService.checkout(userId, req.body);
      res.status(201).json(formatResponse('Order created successfully', checkoutData));
    } catch (error) {
      next(error);
    }
  }
}
