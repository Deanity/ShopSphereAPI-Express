import { Request, Response, NextFunction } from 'express';
import { User } from '../users/user.model.js';
import { Order, OrderStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { Return, ReturnStatus } from '../returns/return.model.js';
import { env } from '../../config/env.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';
import mongoose from 'mongoose';

export class AdminController {
  static async getUsersList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
      const search = req.query.search as string | undefined;
      const role = req.query.role as string || 'all';

      const queryObj: mongoose.FilterQuery<typeof User> = {};

      if (role !== 'all') {
        queryObj.role = role;
      }

      if (search) {
        queryObj.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const total = await User.countDocuments(queryObj);
      const totalPages = Math.ceil(total / limit);

      const users = await User.find(queryObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'); // Never expose password hash

      res.status(200).json(
        formatResponse('Users list retrieved successfully', users, {
          page,
          limit,
          total,
          totalPages,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      user.isActive = isActive;
      await user.save();

      // Remove password hash from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.status(200).json(formatResponse(`User account status updated successfully`, userResponse));
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Total orders count
      const totalOrders = await Order.countDocuments();

      // 2. Total revenue (paid, processing, shipped, delivered)
      const revenueResult = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      // 3. Low-stock products count (threshold from env)
      const lowStockCount = await Product.countDocuments({
        stock: { $lte: env.LOW_STOCK_THRESHOLD },
        isActive: true,
      });

      // 4. Pending return requests count
      const pendingReturns = await Return.countDocuments({
        status: ReturnStatus.PENDING,
      });

      res.status(200).json(
        formatResponse('Dashboard statistics retrieved successfully', {
          totalOrders,
          totalRevenue,
          lowStockCount,
          pendingReturns,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}
