import crypto from 'crypto';
import mongoose from 'mongoose';
import { Xendit } from 'xendit-node';
import { env } from '../../config/env.js';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { CartService } from '../cart/cart.service.js';
import { CouponService } from '../coupons/coupon.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { EmailService } from '../emails/email.service.js';
import { AppError } from '../../utils/appError.js';

// Initialize Xendit SDK
const xendit = new Xendit({ secretKey: env.XENDIT_SECRET_KEY });

export class CheckoutService {
  static async checkout(
    userId: string,
    data: {
      addressId: string;
      shipping: {
        courier: 'jne' | 'pos' | 'tiki';
        service: string;
        cost: number;
      };
      couponCode?: string;
      notes?: string;
    },
  ): Promise<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    paymentUrl: string;
    expiresAt: Date;
  }> {
    const { addressId, shipping, couponCode, notes } = data;

    // 1. Fetch user profile and address
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.find((addr) => addr._id.toString() === addressId);
    if (!address) {
      throw new AppError('Selected address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    // 2. Fetch user's cart
    const cart = await CartService.getOrCreateCart(userId);
    if (cart.items.length === 0) {
      throw new AppError('Your cart is empty', 400, 'CART_EMPTY');
    }

    // Validate all items in cart are active and in stock
    const orderItems = [];
    let totalWeight = 0;
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.isAvailable) {
        throw new AppError(
          `Product "${item.product.name}" is currently unavailable or out of stock`,
          422,
          'INSUFFICIENT_STOCK',
        );
      }

      // Re-fetch product to get absolute current stock/details
      const dbProduct = await Product.findById(item.product._id);
      if (!dbProduct || !dbProduct.isActive) {
        throw new AppError(
          `Product "${item.product.name}" not found or inactive`,
          404,
          'PRODUCT_NOT_FOUND',
        );
      }

      if (dbProduct.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for product "${dbProduct.name}"`,
          422,
          'INSUFFICIENT_STOCK',
        );
      }

      orderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        image: dbProduct.images[0] || '',
        price: item.priceSnapshot,
        quantity: item.quantity,
      });

      totalWeight += dbProduct.weight * item.quantity;
      subtotal += item.priceSnapshot * item.quantity;
    }

    // 3. Validate coupon (if provided)
    let discountAmount = 0;
    if (couponCode) {
      const cartItemsForValidation = cart.items.map((item) => ({
        product: item.product._id,
        category: item.product.category,
      }));

      const couponRes = await CouponService.validateCoupon(
        couponCode,
        subtotal,
        userId,
        cartItemsForValidation,
      );
      discountAmount = couponRes.discountAmount;
    }

    // 4. Verify shipping cost with RajaOngkir
    // Find RajaOngkir city_id from address city name
    const cities = await ShippingService.getCities();
    const matchedCity = cities.find(
      (c) =>
        c.city_name.toLowerCase() === address.city.toLowerCase() ||
        c.city_id.toString() === address.city.toString(),
    );

    if (!matchedCity) {
      throw new AppError('Invalid shipping address city', 400, 'INVALID_CITY_ID');
    }

    const destinationCityId = matchedCity.city_id.toString();
    const rajaOngkirCost = await ShippingService.calculateCost(
      destinationCityId,
      totalWeight,
      shipping.courier,
    );

    const matchedService = rajaOngkirCost.services.find(
      (s) => s.service.toUpperCase() === shipping.service.toUpperCase(),
    );

    if (!matchedService) {
      throw new AppError('Selected shipping service is unavailable', 422, 'SHIPPING_SERVICE_UNAVAILABLE');
    }

    if (matchedService.cost !== shipping.cost) {
      throw new AppError(
        `Shipping cost mismatch. Expected: ${matchedService.cost}, Got: ${shipping.cost}`,
        422,
        'SHIPPING_COST_MISMATCH',
      );
    }

    // 5. Calculate final checkout amounts
    const shippingCost = shipping.cost;
    const totalAmount = subtotal + shippingCost - discountAmount;

    // 6. Generate orderNumber: ORD-YYYYMMDD-XXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    // 7. Create Order (status: pending_payment)
    const orderData = {
      orderNumber,
      user: user._id,
      items: orderItems,
      shippingAddress: {
        recipientName: address.recipientName,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
        fullAddress: address.fullAddress,
      },
      shipping: {
        courier: shipping.courier,
        service: shipping.service.toUpperCase(),
        cost: shippingCost,
        estimatedDays: matchedService.estimatedDays,
      },
      subtotal,
      shippingCost,
      discountAmount,
      totalAmount,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      notes,
    } as any;

    if (couponCode) {
      orderData.coupon = {
        code: couponCode.toUpperCase().trim(),
        discountAmount,
      };
    }

    const order = await Order.create(orderData);

    // 8. Create Xendit Invoice
    const expiresAt = new Date(Date.now() + env.PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);

    try {
      // Create Invoice on Xendit
      const xenditInvoice = await xendit.Invoice.createInvoice({
        data: {
          externalId: orderNumber,
          amount: totalAmount,
          description: `Payment for Order ${orderNumber}`,
          customer: {
            givenNames: user.name,
            email: user.email,
            mobileNumber: user.phone,
          },
          invoiceDuration: env.PAYMENT_EXPIRY_HOURS * 3600,
        },
      });

      order.xenditInvoiceId = xenditInvoice.id;
      order.xenditInvoiceUrl = xenditInvoice.invoiceUrl;
      await order.save();

      // Increment coupon usageCount
      if (couponCode) {
        await Coupon.updateOne(
          { code: couponCode.toUpperCase().trim() },
          { $inc: { usageCount: 1 } },
        );
      }

      // Send Order Created Email (asynchronous placeholder)
      EmailService.sendOrderCreatedEmail(user.email, orderNumber).catch((err) =>
        console.error('❌ Failed to send order created email:', err),
      );

      return {
        orderId: order._id.toString(),
        orderNumber,
        totalAmount,
        paymentUrl: xenditInvoice.invoiceUrl,
        expiresAt,
      };
    } catch (error: any) {
      console.error('❌ Xendit Invoice creation failed:', error.message || error);

      // Rollback Order creation if payment gateway fails
      await Order.deleteOne({ _id: order._id });

      throw new AppError(
        'Payment gateway is temporarily unavailable',
        503,
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
    }
  }
}
