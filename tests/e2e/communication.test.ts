import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Notification, NotificationType } from '../../src/modules/notifications/notification.model.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Phase 3 E2E Communication Integration Tests', () => {
  let customerToken: string;
  let customerId: string;
  let mongoServer: MongoMemoryServer;
  let notificationId1: string;
  let notificationId2: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Register a test customer
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: 'password123',
    });
    
    customerToken = regRes.body.data.accessToken;
    customerId = regRes.body.data.user._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Notification API Endpoints', () => {
    it('should return empty notification list initially', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(0);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should retrieve created notifications', async () => {
      // Create some mock notifications in the database
      const notif1 = await Notification.create({
        user: new mongoose.Types.ObjectId(customerId),
        type: NotificationType.ORDER_CREATED,
        title: 'Pesanan Dibuat',
        body: 'Pesanan ORD-12345 telah dibuat',
        isRead: false,
      });
      notificationId1 = notif1._id.toString();

      const notif2 = await Notification.create({
        user: new mongoose.Types.ObjectId(customerId),
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Pembayaran Sukses',
        body: 'Pembayaran ORD-12345 dikonfirmasi',
        isRead: false,
      });
      notificationId2 = notif2._id.toString();

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('should mark a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId1}/read`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unread count is updated
      const getRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.body.data.unreadCount).toBe(1);
      
      const updatedNotif = await Notification.findById(notificationId1);
      expect(updatedNotif?.isRead).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unread count is updated to 0
      const getRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.body.data.unreadCount).toBe(0);
      expect(getRes.body.data.notifications.every((n: any) => n.isRead === true)).toBe(true);
    });

    it('should throw validation error if notification ID is invalid on read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Forgot Password Flow (Email Trigger)', () => {
    it('should successfully trigger forgot password email sending', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();
    });

    it('should fail to request password reset for non-existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });
});
