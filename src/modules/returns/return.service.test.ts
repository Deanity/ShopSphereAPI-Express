import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ReturnService } from './return.service.js';
import { Return, ReturnReason, ReturnStatus } from './return.model.js';
import { Order, OrderStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { OrderService } from '../orders/order.service.js';
import { EmailService } from '../emails/email.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { AppError } from '../../utils/appError.js';

vi.mock('./return.model.js');
vi.mock('../orders/order.model.js');
vi.mock('../products/product.model.js');
vi.mock('../users/user.model.js');
vi.mock('../orders/order.service.js');
vi.mock('../emails/email.service.js');
vi.mock('../notifications/notification.service.js');

describe('ReturnService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReturnRequest', () => {
    it('should throw an error if the order is not found', async () => {
      vi.mocked(Order.findById).mockResolvedValue(null);

      await expect(
        ReturnService.createReturnRequest('user-1', {
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [],
          reason: ReturnReason.DAMAGED,
          description: 'Damaged',
        })
      ).rejects.toThrowError(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    });

    it('should throw an error if the order does not belong to the user', async () => {
      const mockOrder = { user: new mongoose.Types.ObjectId() };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.createReturnRequest('user-different', {
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [],
          reason: ReturnReason.DAMAGED,
          description: 'Damaged',
        })
      ).rejects.toThrowError(new AppError('Access denied to this order', 403, 'FORBIDDEN'));
    });

    it('should throw an error if the order status is not DELIVERED', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockOrder = { user: userId, status: OrderStatus.PROCESSING };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.createReturnRequest(userId, {
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [],
          reason: ReturnReason.DAMAGED,
          description: 'Damaged',
        })
      ).rejects.toThrowError(
        new AppError('Order is not eligible for return. Status must be DELIVERED.', 422, 'ORDER_NOT_ELIGIBLE_FOR_RETURN')
      );
    });

    it('should throw an error if the 7-day return window has expired', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      // 8 days ago
      const updatedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const mockOrder = { user: userId, status: OrderStatus.DELIVERED, updatedAt };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await expect(
        ReturnService.createReturnRequest(userId, {
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [],
          reason: ReturnReason.DAMAGED,
          description: 'Damaged',
        })
      ).rejects.toThrowError(
        new AppError('The return window for this order has expired (max 7 days)', 422, 'RETURN_WINDOW_EXPIRED')
      );
    });

    it('should throw an error if a return request already exists', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockOrder = { user: userId, status: OrderStatus.DELIVERED, updatedAt: new Date() };
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);
      vi.mocked(Return.findOne).mockResolvedValue({ id: 'exists' } as any);

      await expect(
        ReturnService.createReturnRequest(userId, {
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [],
          reason: ReturnReason.DAMAGED,
          description: 'Damaged',
        })
      ).rejects.toThrowError(
        new AppError('A return request already exists for this order', 409, 'RETURN_ALREADY_EXISTS')
      );
    });
  });

  describe('resolveReturnRequest', () => {
    it('should throw an error if return request is not found', async () => {
      vi.mocked(Return.findById).mockResolvedValue(null);

      await expect(
        ReturnService.resolveReturnRequest(new mongoose.Types.ObjectId().toString(), {
          status: ReturnStatus.APPROVED,
          refundAmount: 100000,
        })
      ).rejects.toThrowError(new AppError('Return request not found', 404, 'RETURN_NOT_FOUND'));
    });

    it('should successfully resolve return request and restore stock if APPROVED', async () => {
      const returnId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId().toString();

      const mockReturn = {
        _id: returnId,
        order: orderId,
        user: new mongoose.Types.ObjectId().toString(),
        status: ReturnStatus.PENDING,
        items: [{ product: productId, quantity: 2, reason: 'damaged' }],
        save: vi.fn(),
      };
      const mockOrder = { _id: orderId, orderNumber: 'ORD-TEST' };
      const mockCustomer = { email: 'customer@example.com', name: 'Customer Name' };

      vi.mocked(Return.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockReturn),
      } as any);
      // Wait, Return.findById without populate:
      vi.mocked(Return.findById).mockResolvedValue(mockReturn as any);
      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);
      vi.mocked(User.findById).mockResolvedValue(mockCustomer as any);
      vi.mocked(Product.findByIdAndUpdate).mockResolvedValue({} as any);

      const result = await ReturnService.resolveReturnRequest(returnId, {
        status: ReturnStatus.APPROVED,
        refundAmount: 500000,
        adminNotes: 'Good',
      });

      expect(OrderService.updateOrderStatus).toHaveBeenCalledWith(orderId, OrderStatus.REFUNDED);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, {
        $inc: { stock: 2, sold: -2 },
      });
      expect(NotificationService.createNotification).toHaveBeenCalled();
      expect(EmailService.sendReturnResolvedEmail).toHaveBeenCalled();
      expect(result.status).toBe(ReturnStatus.APPROVED);
    });
  });
});
