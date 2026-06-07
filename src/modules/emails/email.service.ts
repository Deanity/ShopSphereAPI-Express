import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { Order } from '../orders/order.model.js';
import { User } from '../users/user.model.js';

// Import templates
import { orderCreatedTemplate } from './templates/orderCreated.js';
import { paymentSuccessTemplate } from './templates/paymentSuccess.js';
import { orderShippedTemplate } from './templates/orderShipped.js';
import { orderDeliveredTemplate } from './templates/orderDelivered.js';
import { returnResolvedTemplate } from './templates/returnResolved.js';
import { passwordResetTemplate } from './templates/passwordReset.js';

// Initialize Resend with API key
const resend = new Resend(env.RESEND_API_KEY || 're_mock');

export class EmailService {
  private static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (env.NODE_ENV === 'test') {
        console.log(`
=========================================
[MOCK EMAIL SENT]
To: ${to}
Subject: ${subject}
HTML Length: ${html.length} characters
=========================================
        `);
        return;
      }

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log(`[EMAIL] Email sent successfully to ${to}`);
    } catch (error) {
      // Email failures must NOT crash the main flow
      console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
    }
  }

  static async sendOrderCreatedEmail(email: string, orderNumber: string): Promise<void> {
    try {
      const order = await Order.findOne({ orderNumber }).populate('user');
      if (!order) {
        console.error(`[EMAIL ERROR] Order ${orderNumber} not found for orderCreated email`);
        return;
      }

      const recipientName = (order.user as any)?.name || 'Pelanggan';
      
      const items = order.items.map((item) => ({
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      }));

      const html = orderCreatedTemplate(
        recipientName,
        order.orderNumber,
        items,
        order.subtotal,
        order.shippingCost,
        order.discountAmount,
        order.totalAmount,
        order.shippingAddress,
        order.xenditInvoiceUrl || '',
      );

      await this.sendEmail(email, `Pesanan Dibuat - Menunggu Pembayaran #${orderNumber}`, html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing orderCreated email:`, error);
    }
  }

  static async sendPaymentSuccessEmail(email: string, orderNumber: string): Promise<void> {
    try {
      const order = await Order.findOne({ orderNumber }).populate('user');
      if (!order) {
        console.error(`[EMAIL ERROR] Order ${orderNumber} not found for paymentSuccess email`);
        return;
      }

      const recipientName = (order.user as any)?.name || 'Pelanggan';

      const items = order.items.map((item) => ({
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      }));

      const html = paymentSuccessTemplate(
        recipientName,
        order.orderNumber,
        items,
        order.subtotal,
        order.shippingCost,
        order.discountAmount,
        order.totalAmount,
        order.shippingAddress,
        order.paidAt || new Date(),
      );

      await this.sendEmail(email, `Pembayaran Berhasil - Invoice #${orderNumber}`, html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing paymentSuccess email:`, error);
    }
  }

  static async sendOrderShippedEmail(email: string, orderNumber: string, trackingNumber: string): Promise<void> {
    try {
      const order = await Order.findOne({ orderNumber }).populate('user');
      if (!order) {
        console.error(`[EMAIL ERROR] Order ${orderNumber} not found for orderShipped email`);
        return;
      }

      const recipientName = (order.user as any)?.name || 'Pelanggan';
      const courier = order.shipping.courier || 'JNE';
      const service = order.shipping.service || 'REG';
      const estimatedDays = order.shipping.estimatedDays || '3-5';

      const html = orderShippedTemplate(
        recipientName,
        order.orderNumber,
        courier,
        service,
        trackingNumber,
        estimatedDays,
      );

      await this.sendEmail(email, `Pesanan Anda Telah Dikirim! Resi: ${trackingNumber}`, html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing orderShipped email:`, error);
    }
  }

  static async sendOrderDeliveredEmail(email: string, orderNumber: string): Promise<void> {
    try {
      const order = await Order.findOne({ orderNumber }).populate('user');
      if (!order) {
        console.error(`[EMAIL ERROR] Order ${orderNumber} not found for orderDelivered email`);
        return;
      }

      const recipientName = (order.user as any)?.name || 'Pelanggan';

      const html = orderDeliveredTemplate(recipientName, order.orderNumber);

      await this.sendEmail(email, `Pesanan Diterima - #${orderNumber}`, html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing orderDelivered email:`, error);
    }
  }

  static async sendReturnResolvedEmail(
    email: string,
    orderNumber: string,
    status: 'approved' | 'rejected',
    refundAmount?: number,
    adminNotes?: string,
  ): Promise<void> {
    try {
      const user = await User.findOne({ email });
      const recipientName = user?.name || 'Pelanggan';

      const html = returnResolvedTemplate(
        recipientName,
        orderNumber,
        status,
        refundAmount,
        adminNotes,
      );

      const statusLabel = status === 'approved' ? 'DISETUJUI' : 'DITOLAK';
      await this.sendEmail(email, `Pengembalian Barang ${statusLabel} - #${orderNumber}`, html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing returnResolved email:`, error);
    }
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
      const recipientName = user?.name || 'Pelanggan';
      
      const resetUrl = `${env.APP_URL}/api/v1/auth/reset-password/${token}`;

      const html = passwordResetTemplate(recipientName, resetUrl);

      await this.sendEmail(email, 'Atur Ulang Kata Sandi - ShopSphere', html);
    } catch (error) {
      console.error(`[EMAIL ERROR] Error preparing passwordReset email:`, error);
    }
  }
}
