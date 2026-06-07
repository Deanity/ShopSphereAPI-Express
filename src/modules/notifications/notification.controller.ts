import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';
import { formatResponse } from '../../utils/formatResponse.js';
import { AppError } from '../../utils/appError.js';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const data = await NotificationService.getNotifications(userId);
      res.status(200).json(formatResponse('Notifications retrieved successfully', data));
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, userId);
      
      res.status(200).json(formatResponse('Notification marked as read', null));
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'INVALID_TOKEN');
      }

      await NotificationService.markAllAsRead(userId);
      res.status(200).json(formatResponse('All notifications marked as read', null));
    } catch (error) {
      next(error);
    }
  }
}
