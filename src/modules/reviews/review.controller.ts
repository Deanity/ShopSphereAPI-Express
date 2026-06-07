import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class ReviewController {
  static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id: productId } = req.params;
      const review = await ReviewService.submitReview(productId, userId, req.body);
      
      res.status(201).json(formatResponse('Review submitted successfully', review));
    } catch (error) {
      next(error);
    }
  }

  static async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: productId } = req.params;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);

      const data = await ReviewService.getProductReviews(productId, { page, limit });
      
      res.status(200).json(formatResponse('Product reviews retrieved successfully', data.reviews, data.meta));
    } catch (error) {
      next(error);
    }
  }

  static async deleteReviewAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: reviewId } = req.params;
      await ReviewService.deleteReviewAdmin(reviewId);
      
      res.status(200).json(formatResponse('Review deleted successfully', null));
    } catch (error) {
      next(error);
    }
  }
}
