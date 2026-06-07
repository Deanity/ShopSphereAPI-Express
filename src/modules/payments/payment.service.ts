import mongoose from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { CartService } from '../cart/cart.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { EmailService } from '../emails/email.service.js';
import { NotificationType } from '../notifications/notification.model.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';

export class PaymentService {
  static async handleWebhook(payload: {
    id: string;
    external_id: string;
    status: string;
    amount?: number;
  }): Promise<void> {
    const { external_id: orderNumber, status: invoiceStatus } = payload;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw new AppError(`Order not found for number ${orderNumber}`, 404, 'ORDER_NOT_FOUND');
    }

    // Idempotency check: skip if order already PAID
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      console.log(`[INFO] Idempotency check: Order ${orderNumber} is already PAID. Skipping.`);
      return;
    }

    const uppercaseStatus = invoiceStatus.toUpperCase();

    if (uppercaseStatus === 'PAID' || uppercaseStatus === 'SETTLED') {
      // 1. Update Order status
      order.status = OrderStatus.PAID;
      order.paymentStatus = PaymentStatus.PAID;
      order.paidAt = new Date();
      await order.save();

      // 2. Decrement stock for each item atomically
      const adminUser = await User.findOne({ role: 'admin' });

      for (const item of order.items) {
        // Find and decrement stock if stock >= quantity
        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, sold: item.quantity } },
          { new: true },
        );

        if (!product) {
          // Anomaly: stock is insufficient at webhook time
          console.error(
            `❌ [STOCK ANOMALY] Insufficient stock for product ID ${item.product} during payment verification for order ${orderNumber}`,
          );

          if (adminUser) {
            await NotificationService.createNotification(
              adminUser._id,
              NotificationType.LOW_STOCK,
              'ANOMALI STOK: Stok Tidak Mencukupi!',
              `Produk ID ${item.product} tidak memiliki stok yang cukup untuk memenuhi pesanan ${orderNumber}.`,
              { productId: item.product.toString(), orderId: order._id.toString() },
            );
          }
        } else {
          // Check if stock is low (<= LOW_STOCK_THRESHOLD)
          if (product.stock <= env.LOW_STOCK_THRESHOLD) {
            if (adminUser) {
              await NotificationService.createNotification(
                adminUser._id,
                NotificationType.LOW_STOCK,
                'Stok Menipis!',
                `Stok produk "${product.name}" tersisa ${product.stock}`,
                { productId: product._id.toString() },
              );
            }
          }
        }
      }

      // 3. Clear user's cart
      await CartService.clearCart(order.user.toString());

      // 4. Trigger user notification & email
      const user = await User.findById(order.user);
      if (user) {
        // Create in-app notification for customer
        await NotificationService.createNotification(
          user._id,
          NotificationType.PAYMENT_SUCCESS,
          'Pembayaran Sukses!',
          `Pembayaran untuk pesanan ${orderNumber} telah kami terima dan sedang diproses.`,
          { orderId: order._id.toString() },
        );

        // Send email confirmation
        EmailService.sendPaymentSuccessEmail(user.email, orderNumber).catch((err) =>
          console.error('❌ Failed to send payment success email:', err),
        );
      }
    } else if (uppercaseStatus === 'EXPIRED') {
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.EXPIRED;
      await order.save();

      // Restore coupon usage count
      if (order.coupon?.code) {
        await Coupon.updateOne(
          { code: order.coupon.code.toUpperCase().trim() },
          { $inc: { usageCount: -1 } },
        );
      }
    } else if (uppercaseStatus === 'FAILED') {
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      // Restore coupon usage count
      if (order.coupon?.code) {
        await Coupon.updateOne(
          { code: order.coupon.code.toUpperCase().trim() },
          { $inc: { usageCount: -1 } },
        );
      }
    }
  }
}
