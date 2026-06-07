import mongoose from 'mongoose';
import { Return, IReturn, ReturnReason, ReturnStatus } from './return.model.js';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { OrderService } from '../orders/order.service.js';
import { EmailService } from '../emails/email.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { NotificationType } from '../notifications/notification.model.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';

export interface PaginatedReturnsResponse {
  returns: IReturn[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ReturnService {
  static async createReturnRequest(
    userId: string,
    data: {
      orderId: string;
      items: Array<{ productId: string; quantity: number; reason: string }>;
      reason: ReturnReason;
      description: string;
      images?: string[];
    },
  ): Promise<IReturn> {
    const { orderId, items, reason, description, images } = data;

    // 1. Fetch Order and validate
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Access control: Order must belong to the user
    if (order.user.toString() !== userId) {
      throw new AppError('Access denied to this order', 403, 'FORBIDDEN');
    }

    // Return request can only be made if order is DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError(
        'Order is not eligible for return. Status must be DELIVERED.',
        422,
        'ORDER_NOT_ELIGIBLE_FOR_RETURN',
      );
    }

    // Return request can only be made within 7 days of delivery
    const timeDiff = Date.now() - order.updatedAt.getTime();
    const returnWindowMs = env.RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (timeDiff > returnWindowMs) {
      throw new AppError(
        'The return window for this order has expired (max 7 days)',
        422,
        'RETURN_WINDOW_EXPIRED',
      );
    }

    // Prevent duplicate return requests for the same order
    const existingReturn = await Return.findOne({ order: order._id });
    if (existingReturn) {
      throw new AppError('A return request already exists for this order', 409, 'RETURN_ALREADY_EXISTS');
    }

    // Validate returned items against the order items
    const returnItems = [];
    for (const returnItem of items) {
      const orderItem = order.items.find((item) => item.product.toString() === returnItem.productId);
      if (!orderItem) {
        throw new AppError(
          `Product "${returnItem.productId}" was not part of this order`,
          422,
          'PRODUCT_NOT_IN_ORDER',
        );
      }

      if (returnItem.quantity > orderItem.quantity) {
        throw new AppError(
          `Return quantity for product "${orderItem.name}" exceeds the quantity purchased`,
          422,
          'INVALID_RETURN_QUANTITY',
        );
      }

      returnItems.push({
        product: new mongoose.Types.ObjectId(returnItem.productId),
        quantity: returnItem.quantity,
        reason: returnItem.reason,
      });
    }

    // Create the Return request
    const returnRequest = await Return.create({
      order: order._id,
      user: new mongoose.Types.ObjectId(userId),
      items: returnItems,
      reason,
      description,
      images: images || [],
      status: ReturnStatus.PENDING,
      refundAmount: 0,
    });

    return returnRequest;
  }

  static async getMyReturns(
    userId: string,
    params: { page: number; limit: number },
  ): Promise<PaginatedReturnsResponse> {
    const { page, limit } = params;
    const queryObj = { user: new mongoose.Types.ObjectId(userId) };

    const skip = (page - 1) * limit;
    const total = await Return.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const returns = await Return.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber status');

    return {
      returns,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getReturnById(id: string, userId: string, role: 'customer' | 'admin'): Promise<IReturn> {
    const returnRequest = await Return.findById(id).populate('order', 'orderNumber status');
    if (!returnRequest) {
      throw new AppError('Return request not found', 404, 'RETURN_NOT_FOUND');
    }

    // Access control: customer can only view their own return requests
    if (role === 'customer' && returnRequest.user.toString() !== userId) {
      throw new AppError('Access denied to this return request', 403, 'FORBIDDEN');
    }

    return returnRequest;
  }

  static async getAllReturnsAdmin(
    params: { page: number; limit: number; status?: string },
  ): Promise<PaginatedReturnsResponse> {
    const { page, limit, status } = params;
    const queryObj: mongoose.FilterQuery<IReturn> = {};

    if (status) {
      queryObj.status = status as ReturnStatus;
    }

    const skip = (page - 1) * limit;
    const total = await Return.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const returns = await Return.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', '_id name email')
      .populate('order', 'orderNumber status');

    return {
      returns,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async resolveReturnRequest(
    id: string,
    data: {
      status: ReturnStatus;
      refundAmount: number;
      adminNotes?: string;
    },
  ): Promise<IReturn> {
    const { status, refundAmount, adminNotes } = data;

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      throw new AppError('Return request not found', 404, 'RETURN_NOT_FOUND');
    }

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new AppError(
        `Return request has already been resolved with status: ${returnRequest.status}`,
        422,
        'INVALID_RETURN_STATUS_TRANSITION',
      );
    }

    const order = await Order.findById(returnRequest.order);
    if (!order) {
      throw new AppError('Associated order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Process resolution
    returnRequest.status = status;
    returnRequest.refundAmount = refundAmount;
    returnRequest.adminNotes = adminNotes;
    returnRequest.resolvedAt = new Date();
    await returnRequest.save();

    const customer = await User.findById(returnRequest.user);

    if (status === ReturnStatus.APPROVED) {
      // 1. Update Order status to REFUNDED (and sync paymentStatus)
      await OrderService.updateOrderStatus(order._id.toString(), OrderStatus.REFUNDED);

      // 2. Restore stock for returned items atomically
      for (const item of returnRequest.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }

      // 3. Trigger In-App Notification (approved)
      if (customer) {
        await NotificationService.createNotification(
          customer._id,
          NotificationType.RETURN_APPROVED,
          'Return Barang Disetujui',
          `Pengajuan pengembalian barang Anda untuk pesanan ${order.orderNumber} telah disetujui.`,
          { orderId: order._id.toString(), returnId: returnRequest._id.toString() },
        );
      }
    } else if (status === ReturnStatus.REJECTED) {
      // Trigger In-App Notification (rejected)
      if (customer) {
        await NotificationService.createNotification(
          customer._id,
          NotificationType.RETURN_REJECTED,
          'Return Barang Ditolak',
          `Pengajuan pengembalian barang Anda untuk pesanan ${order.orderNumber} ditolak. Alasan: ${adminNotes || '-'}`,
          { orderId: order._id.toString(), returnId: returnRequest._id.toString() },
        );
      }
    }

    // Trigger Email Notification (asynchronous non-blocking)
    if (customer) {
      const emailPromise = EmailService.sendReturnResolvedEmail(
        customer.email,
        order.orderNumber,
        status === ReturnStatus.APPROVED ? 'approved' : 'rejected',
        refundAmount,
        adminNotes,
      );
      if (emailPromise && typeof emailPromise.catch === 'function') {
        emailPromise.catch((err) => console.error('❌ Failed to send return resolved email:', err));
      }
    }

    return returnRequest;
  }
}
