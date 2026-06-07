import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';
import { OrderStatus } from './order.model.js';

export class OrderController {
  static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await OrderService.getOrders(userId, { page, limit, status });
      res.status(200).json(formatResponse('Orders retrieved successfully', result.orders, result.meta));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      const order = await OrderService.getOrderById(id, userId, role);
      res.status(200).json(formatResponse('Order details retrieved successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrdersAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await OrderService.getAllOrders({ page, limit, status });
      res.status(200).json(formatResponse('All orders retrieved successfully', result.orders, result.meta));
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatusAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, trackingNumber, courier } = req.body;

      const order = await OrderService.updateOrderStatus(id, status as OrderStatus, {
        trackingNumber,
        courier,
      });

      res.status(200).json(formatResponse('Order status updated successfully', order));
    } catch (error) {
      next(error);
    }
  }
}
