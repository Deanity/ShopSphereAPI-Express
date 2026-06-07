import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, PaymentStatus } from './order.model.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../utils/appError.js';
import { EmailService } from '../emails/email.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { NotificationType } from '../notifications/notification.model.js';

export interface PaginatedOrdersResponse {
  orders: IOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class OrderService {
  static async getOrders(
    userId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<PaginatedOrdersResponse> {
    const { page, limit, status } = params;
    const queryObj: mongoose.FilterQuery<IOrder> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      queryObj.status = status as OrderStatus;
    }

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const orders = await Order.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getOrderById(id: string, userId: string, role: 'customer' | 'admin'): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Customer can only access their own orders
    if (role === 'customer' && order.user.toString() !== userId) {
      throw new AppError('Access denied to this order', 403, 'FORBIDDEN');
    }

    return order;
  }

  static async getAllOrders(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<PaginatedOrdersResponse> {
    const { page, limit, status } = params;
    const queryObj: mongoose.FilterQuery<IOrder> = {};

    if (status) {
      queryObj.status = status as OrderStatus;
    }

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const orders = await Order.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', '_id name email');

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    options?: { trackingNumber?: string; courier?: string },
  ): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const currentStatus = order.status;

    // Validate state transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        422,
        'INVALID_STATUS_TRANSITION',
      );
    }

    // Admin must provide trackingNumber and courier when updating to SHIPPED
    if (newStatus === OrderStatus.SHIPPED) {
      if (!options?.trackingNumber || !options?.courier) {
        throw new AppError(
          'Courier and tracking number are required when shipping an order',
          422,
          'SHIPPING_DETAILS_REQUIRED',
        );
      }
      order.trackingNumber = options.trackingNumber;
      order.shipping.courier = options.courier;
    }

    // Set status
    order.status = newStatus;

    // Sync paymentStatus with status if necessary
    if (newStatus === OrderStatus.PAID) {
      order.paymentStatus = PaymentStatus.PAID;
      order.paidAt = new Date();
    } else if (newStatus === OrderStatus.CANCELLED) {
      order.paymentStatus =
        order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : PaymentStatus.FAILED;
    } else if (newStatus === OrderStatus.REFUNDED) {
      order.paymentStatus = PaymentStatus.REFUNDED;
    }

    await order.save();

    // Trigger asynchronous notifications and emails
    const user = await User.findById(order.user);
    if (user) {
      if (newStatus === OrderStatus.SHIPPED) {
        // Create in-app notification
        await NotificationService.createNotification(
          user._id,
          NotificationType.ORDER_SHIPPED,
          'Pesanan Dikirim!',
          `Pesanan ${order.orderNumber} sedang dalam perjalanan`,
          { orderId: order._id.toString() },
        );
        // Send email
        await EmailService.sendOrderShippedEmail(user.email, order.orderNumber, order.trackingNumber || '');
      } else if (newStatus === OrderStatus.DELIVERED) {
        // Create in-app notification
        await NotificationService.createNotification(
          user._id,
          NotificationType.ORDER_DELIVERED,
          'Pesanan Diterima!',
          `Pesanan ${order.orderNumber} telah sukses dikirim ke alamat Anda`,
          { orderId: order._id.toString() },
        );
        // Send email
        await EmailService.sendOrderDeliveredEmail(user.email, order.orderNumber);
      }
    }

    return order;
  }
}
