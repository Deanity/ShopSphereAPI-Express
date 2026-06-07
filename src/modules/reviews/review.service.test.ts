import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ReviewService } from './review.service.js';
import { Review } from './review.model.js';
import { Order, OrderStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';

vi.mock('./review.model.js');
vi.mock('../orders/order.model.js');
vi.mock('../products/product.model.js');

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitReview', () => {
    it('should throw an error if the order is not found', async () => {
      vi.mocked(Order.findById).mockResolvedValue(null);

      await expect(
        ReviewService.submitReview('product-1', 'user-1', {
          orderId: new mongoose.Types.ObjectId().toString(),
          rating: 5,
          comment: 'Great',
        })
      ).rejects.toThrowError(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    });

    it('should throw an error if the order is not DELIVERED', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockOrder = { user: userId, status: OrderStatus.PROCESSING };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await expect(
        ReviewService.submitReview('product-1', userId, {
          orderId: new mongoose.Types.ObjectId().toString(),
          rating: 5,
          comment: 'Great',
        })
      ).rejects.toThrowError(new AppError('Order must be DELIVERED to submit a review', 422, 'ORDER_NOT_DELIVERED'));
    });

    it('should throw an error if the product is not in the order', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        user: userId,
        status: OrderStatus.DELIVERED,
        items: [{ product: new mongoose.Types.ObjectId() }], // different product
      };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await expect(
        ReviewService.submitReview(new mongoose.Types.ObjectId().toString(), userId, {
          orderId: new mongoose.Types.ObjectId().toString(),
          rating: 5,
          comment: 'Great',
        })
      ).rejects.toThrowError(new AppError('Product is not part of this order', 422, 'PRODUCT_NOT_IN_ORDER'));
    });

    it('should throw an error if user has already reviewed the product for this order', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();

      const mockOrder = {
        _id: orderId,
        user: userId,
        status: OrderStatus.DELIVERED,
        items: [{ product: productId }],
      };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);
      vi.mocked(Review.findOne).mockResolvedValue({ id: 'exists' } as any);

      await expect(
        ReviewService.submitReview(productId.toString(), userId, {
          orderId: orderId.toString(),
          rating: 5,
          comment: 'Great',
        })
      ).rejects.toThrowError(
        new AppError(
          'You have already submitted a review for this product in this order',
          409,
          'REVIEW_ALREADY_EXISTS',
        )
      );
    });

    it('should successfully submit review and recalculate ratings', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();

      const mockOrder = {
        _id: orderId,
        user: userId,
        status: OrderStatus.DELIVERED,
        items: [{ product: productId }],
      };
      const mockReview = {
        product: productId,
        user: userId,
        order: orderId,
        rating: 5,
        comment: 'Great',
      };

      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);
      vi.mocked(Review.findOne).mockResolvedValue(null);
      vi.mocked(Review.create).mockResolvedValue(mockReview as any);
      vi.mocked(Review.aggregate).mockResolvedValue([{ _id: productId, averageRating: 4.8, totalReviews: 10 }]);

      const result = await ReviewService.submitReview(productId.toString(), userId, {
        orderId: orderId.toString(),
        rating: 5,
        comment: 'Great',
      });

      expect(Review.create).toHaveBeenCalled();
      expect(Review.aggregate).toHaveBeenCalled();
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, {
        averageRating: 4.8,
        totalReviews: 10,
      });
      expect(result).toEqual(mockReview);
    });
  });
});
