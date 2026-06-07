import { Request, Response, NextFunction } from 'express';
import { CouponService } from './coupon.service.js';
import { CartService } from '../cart/cart.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class CouponController {
  static async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { code, subtotal } = req.body;

      // Fetch user's cart to check product applicability
      const cart = await CartService.getOrCreateCart(userId);
      const cartItems = cart.items.map((item) => ({
        product: item.product._id,
        category: item.product.category,
      }));

      const result = await CouponService.validateCoupon(code, subtotal, userId, cartItems);

      res.status(200).json(formatResponse('Coupon is valid', result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      res.status(201).json(formatResponse('Coupon created successfully', coupon));
    } catch (error) {
      next(error);
    }
  }

  static async getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await CouponService.getCoupons();
      res.status(200).json(formatResponse('Coupons retrieved successfully', coupons));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await CouponService.updateCoupon(id, req.body);
      res.status(200).json(formatResponse('Coupon updated successfully', coupon));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await CouponService.deleteCoupon(id);
      res.status(200).json(formatResponse('Coupon deleted successfully', null));
    } catch (error) {
      next(error);
    }
  }
}
