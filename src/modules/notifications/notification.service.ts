import mongoose from 'mongoose';
import { Notification, NotificationType, INotification } from './notification.model.js';

export class NotificationService {
  static async createNotification(
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<INotification | null> {
    try {
      const notification = await Notification.create({
        user: new mongoose.Types.ObjectId(userId),
        type,
        title,
        body,
        data,
        isRead: false,
      });
      return notification;
    } catch (error) {
      // Notification creation failures must NOT crash the triggering operation
      console.error('❌ Failed to create notification:', error);
      return null;
    }
  }

  static async getNotifications(userId: string): Promise<{
    notifications: INotification[];
    unreadCount: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notifications = await Notification.find({ user: userObjectId }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ user: userObjectId, isRead: false });

    return {
      notifications,
      unreadCount,
    };
  }

  static async markAsRead(id: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
  }
}
