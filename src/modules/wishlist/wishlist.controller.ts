import { Request, Response, NextFunction } from 'express';
import { WishlistService } from './wishlist.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class WishlistController {
  static async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const wishlist = await WishlistService.getWishlist(userId);
      res.status(200).json(formatResponse('Wishlist retrieved successfully', wishlist));
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

      const { productId } = req.body;
      const wishlist = await WishlistService.addToWishlist(userId, productId);
      res.status(200).json(formatResponse('Item added to wishlist successfully', wishlist));
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
      const wishlist = await WishlistService.removeFromWishlist(userId, productId);
      res.status(200).json(formatResponse('Item removed from wishlist successfully', wishlist));
    } catch (error) {
      next(error);
    }
  }
}
