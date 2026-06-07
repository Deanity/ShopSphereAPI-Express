import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const cartData = await CartService.getOrCreateCart(userId);
      res.status(200).json(formatResponse('Cart retrieved successfully', cartData));
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { productId, quantity } = req.body;
      const cartData = await CartService.addItemToCart(userId, productId, quantity);
      res.status(200).json(formatResponse('Item added to cart successfully', cartData));
    } catch (error) {
      next(error);
    }
  }

  static async updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      const cartData = await CartService.updateItemQuantity(userId, productId, quantity);
      res.status(200).json(formatResponse('Cart item quantity updated successfully', cartData));
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { productId } = req.params;
      const cartData = await CartService.removeItemFromCart(userId, productId);
      res.status(200).json(formatResponse('Item removed from cart successfully', cartData));
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      await CartService.clearCart(userId);
      res.status(200).json(formatResponse('Cart cleared successfully', null));
    } catch (error) {
      next(error);
    }
  }
}
