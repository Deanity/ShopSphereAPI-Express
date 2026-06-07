import mongoose from 'mongoose';
import { Review, IReview } from './review.model.js';
import { Order, OrderStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';

export interface PaginatedReviewsResponse {
  reviews: IReview[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ReviewService {
  private static async recalculateProductRating(productId: string | mongoose.Types.ObjectId): Promise<void> {
    const productObjectId = new mongoose.Types.ObjectId(productId);
    
    const stats = await Review.aggregate([
      { $match: { product: productObjectId } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productObjectId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: stats[0].totalReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productObjectId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }
  }

  static async submitReview(
    productId: string,
    userId: string,
    data: {
      orderId: string;
      rating: number;
      comment: string;
      images?: string[];
    },
  ): Promise<IReview> {
    const { orderId, rating, comment, images } = data;

    // 1. Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Access control: order must belong to user
    if (order.user.toString() !== userId) {
      throw new AppError('Access denied to this order', 403, 'FORBIDDEN');
    }

    // Order must be DELIVERED to write a review
    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError('Order must be DELIVERED to submit a review', 422, 'ORDER_NOT_DELIVERED');
    }

    // Product must be part of the order items
    const isProductInOrder = order.items.some((item) => item.product.toString() === productId);
    if (!isProductInOrder) {
      throw new AppError('Product is not part of this order', 422, 'PRODUCT_NOT_IN_ORDER');
    }

    // User can only review a product once per order
    const existingReview = await Review.findOne({
      product: new mongoose.Types.ObjectId(productId),
      user: new mongoose.Types.ObjectId(userId),
      order: order._id,
    });
    if (existingReview) {
      throw new AppError(
        'You have already submitted a review for this product in this order',
        409,
        'REVIEW_ALREADY_EXISTS',
      );
    }

    // Create review
    const review = await Review.create({
      product: new mongoose.Types.ObjectId(productId),
      user: new mongoose.Types.ObjectId(userId),
      order: order._id,
      rating,
      comment,
      images: images || [],
      isVerified: true,
    });

    // Recalculate product rating atomically
    await this.recalculateProductRating(productId);

    return review;
  }

  static async getProductReviews(
    productId: string,
    params: { page: number; limit: number },
  ): Promise<PaginatedReviewsResponse> {
    const { page, limit } = params;
    const queryObj = { product: new mongoose.Types.ObjectId(productId) };

    const skip = (page - 1) * limit;
    const total = await Review.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const reviews = await Review.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', '_id name avatar');

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async deleteReviewAdmin(id: string): Promise<void> {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    const productId = review.product;

    await Review.deleteOne({ _id: review._id });

    // Recalculate product rating atomically after deletion
    await this.recalculateProductRating(productId);
  }
}
