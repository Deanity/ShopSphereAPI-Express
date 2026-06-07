import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { NotificationService } from './notification.service.js';
import { Notification, NotificationType } from './notification.model.js';

vi.mock('./notification.model.js');

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should successfully create a notification and return it', async () => {
      // Arrange
      const mockNotification = {
        user: new mongoose.Types.ObjectId(),
        type: NotificationType.ORDER_CREATED,
        title: 'Title',
        body: 'Body',
        isRead: false,
      };
      vi.mocked(Notification.create).mockResolvedValue(mockNotification as any);

      // Act
      const result = await NotificationService.createNotification(
        mockNotification.user,
        NotificationType.ORDER_CREATED,
        'Title',
        'Body',
      );

      // Assert
      expect(Notification.create).toHaveBeenCalledWith({
        user: mockNotification.user,
        type: NotificationType.ORDER_CREATED,
        title: 'Title',
        body: 'Body',
        isRead: false,
      });
      expect(result).toEqual(mockNotification);
    });

    it('should return null and log the error on creation failure', async () => {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(Notification.create).mockRejectedValue(new Error('DB error'));

      // Act
      const result = await NotificationService.createNotification(
        new mongoose.Types.ObjectId(),
        NotificationType.ORDER_CREATED,
        'Title',
        'Body',
      );

      // Assert
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('getNotifications', () => {
    it('should return all user notifications and unreadCount', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId().toString();
      const mockNotifications = [{ title: 'Notif 1' }, { title: 'Notif 2' }];
      
      vi.mocked(Notification.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockNotifications),
      } as any);
      vi.mocked(Notification.countDocuments).mockResolvedValue(1);

      // Act
      const result = await NotificationService.getNotifications(userId);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ user: new mongoose.Types.ObjectId(userId) });
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      });
      expect(result).toEqual({
        notifications: mockNotifications,
        unreadCount: 1,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a specific notification as read and return it', async () => {
      // Arrange
      const id = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const mockNotification = { _id: id, user: userId, isRead: true };
      
      vi.mocked(Notification.findOneAndUpdate).mockResolvedValue(mockNotification as any);

      // Act
      const result = await NotificationService.markAsRead(id, userId);

      // Assert
      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) },
        { $set: { isRead: true } },
        { new: true },
      );
      expect(result).toEqual(mockNotification);
    });

    it('should throw an error if the notification is not found', async () => {
      // Arrange
      vi.mocked(Notification.findOneAndUpdate).mockResolvedValue(null);

      // Act & Assert
      await expect(
        NotificationService.markAsRead(
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString(),
        )
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      // Arrange
      const userId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Notification.updateMany).mockResolvedValue({} as any);

      // Act
      await NotificationService.markAllAsRead(userId);

      // Assert
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { user: new mongoose.Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true } },
      );
    });
  });
});
