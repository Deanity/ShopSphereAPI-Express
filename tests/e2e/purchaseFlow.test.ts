import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Coupon } from '../../src/modules/coupons/coupon.model.js';
import { Order } from '../../src/modules/orders/order.model.js';
import { Notification } from '../../src/modules/notifications/notification.model.js';
import { StockLog } from '../../src/modules/stock/stockLog.model.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../../src/config/env.js';

// Mock Axios for RajaOngkir
vi.mock('axios');

// Mock Xendit SDK
vi.mock('xendit-node', () => {
  return {
    Xendit: vi.fn().mockImplementation(() => {
      return {
        Invoice: {
          createInvoice: vi.fn().mockImplementation((args) => {
            return Promise.resolve({
              id: 'inv_mock123',
              invoiceUrl: 'https://checkout.xendit.co/v2/inv_mock123',
              externalId: args.data.externalId,
              status: 'PENDING',
              amount: args.data.amount,
            });
          }),
        },
      };
    }),
  };
});

describe('Phase 2 E2E Integration Tests Purchase Flow', () => {
  let mongoServer: MongoMemoryServer;
  let customerToken: string;
  let adminToken: string;

  let categoryId: string;
  let productId: string;
  let productSlug: string;
  let addressId: string;
  let orderId: string;
  let orderNumber: string;

  beforeAll(async () => {
    // Spin up MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Mock axios implementation
    vi.mocked(axios.get).mockImplementation((url: string) => {
      if (url.includes('/province')) {
        return Promise.resolve({
          data: {
            rajaongkir: {
              results: [{ province_id: '1', province: 'Bali' }],
            },
          },
        });
      }
      if (url.includes('/city')) {
        return Promise.resolve({
          data: {
            rajaongkir: {
              results: [
                { city_id: '114', city_name: 'Denpasar', type: 'Kota', province_id: '1' },
                { city_id: '23', city_name: 'Bandung', type: 'Kota', province_id: '9' },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    vi.mocked(axios.post).mockImplementation((url: string) => {
      if (url.includes('/cost')) {
        return Promise.resolve({
          data: {
            rajaongkir: {
              results: [
                {
                  code: 'jne',
                  name: 'JNE',
                  costs: [
                    {
                      service: 'REG',
                      description: 'Layanan Reguler',
                      cost: [{ value: 15000, etd: '2-3 HARI' }],
                    },
                  ],
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // ==========================================
  // INITIAL SEEDING & AUTH SETUP
  // ==========================================
  describe('Setup accounts & catalog', () => {
    it('should register a customer and an admin', async () => {
      // 1. Register customer
      const custRes = await request(app).post('/api/v1/auth/register').send({
        name: 'John Customer',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(custRes.status).toBe(201);
      customerToken = custRes.body.data.accessToken;

      // 2. Add address to customer
      const addrRes = await request(app)
        .post('/api/v1/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'My House',
          recipientName: 'John Customer',
          phone: '081234567890',
          province: 'Bali',
          city: 'Denpasar',
          district: 'Denpasar Barat',
          postalCode: '80117',
          fullAddress: 'Jl. Imam Bonjol No. 12',
          isDefault: true,
        });
      expect(addrRes.status).toBe(201);
      addressId = addrRes.body.data[0]._id;

      // 3. Create admin
      await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'adminpassword123',
        role: 'admin',
        isActive: true,
      });

      // Log in admin
      const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'adminpassword123',
      });
      expect(adminLoginRes.status).toBe(200);
      adminToken = adminLoginRes.body.data.accessToken;
    });

    it('should create category and product', async () => {
      // Create category
      const catRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Gadgets',
        });
      expect(catRes.status).toBe(201);
      categoryId = catRes.body.data._id;

      // Create product
      const prodRes = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'iPhone 15 Pro Max',
          description: 'Premium titanium iPhone with 5x zoom',
          price: 20000000,
          discountPercent: 10, // discounted price: 18,000,000
          images: ['https://example.com/iphone.jpg'],
          category: categoryId,
          stock: 10,
          weight: 221,
          tags: ['iphone', 'gadget'],
        });
      expect(prodRes.status).toBe(201);
      productId = prodRes.body.data._id;
      productSlug = prodRes.body.data.slug;
    });
  });

  // ==========================================
  // CART OPERATIONS
  // ==========================================
  describe('Cart Actions', () => {
    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
          quantity: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.items[0].priceSnapshot).toBe(18000000);
      expect(res.body.data.summary.totalItems).toBe(2);
      expect(res.body.data.summary.subtotal).toBe(36000000);
    });

    it('should update cart item quantity', async () => {
      const res = await request(app)
        .patch(`/api/v1/cart/items/${productId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          quantity: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(3);
      expect(res.body.data.summary.totalItems).toBe(3);
      expect(res.body.data.summary.subtotal).toBe(54000000);
    });
  });

  // ==========================================
  // WISHLIST OPERATIONS
  // ==========================================
  describe('Wishlist Actions', () => {
    it('should add item to wishlist and retrieve it', async () => {
      const addRes = await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
        });
      expect(addRes.status).toBe(200);
      expect(addRes.body.data.products.length).toBe(1);

      const getRes = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.products[0]._id).toBe(productId);
    });
  });

  // ==========================================
  // SHIPPING & COUPONS
  // ==========================================
  describe('Shipping & Coupons validation', () => {
    it('should retrieve shipping cost via RajaOngkir', async () => {
      const costRes = await request(app)
        .post('/api/v1/shipping/cost')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          destinationCityId: '114',
          weight: 663,
          courier: 'jne',
        });

      expect(costRes.status).toBe(200);
      expect(costRes.body.data.courier).toBe('jne');
      expect(costRes.body.data.services[0].cost).toBe(15000);
    });

    it('should support admin creating a coupon and customer validating it', async () => {
      // Admin creates coupon
      const couponRes = await request(app)
        .post('/api/v1/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PROMO10',
          type: 'percentage',
          value: 10,
          minOrderAmount: 1000000,
          maxDiscountAmount: 5000000,
          usageLimit: 100,
          userUsageLimit: 1,
          applicableProducts: [productId],
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(couponRes.status).toBe(201);

      // Customer validates coupon
      const valRes = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'PROMO10',
          subtotal: 54000000,
        });
      expect(valRes.status).toBe(200);
      expect(valRes.body.data.discountAmount).toBe(5000000); // Max discount capped at 5,000,000
    });
  });

  // ==========================================
  // CHECKOUT & WEBHOOK
  // ==========================================
  describe('Checkout and Payment webhook processing', () => {
    it('should checkout successfully and create order & invoice', async () => {
      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId,
          shipping: {
            courier: 'jne',
            service: 'REG',
            cost: 15000,
          },
          couponCode: 'PROMO10',
          notes: 'Deliver before sunset',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.orderId).toBeDefined();
      expect(res.body.data.orderNumber).toBeDefined();
      expect(res.body.data.paymentUrl).toBe('https://checkout.xendit.co/v2/inv_mock123');

      // final amount calculation: subtotal 54,000,000 + shipping 15,000 - discount 5,000,000 = 49,015,000
      expect(res.body.data.totalAmount).toBe(49015000);

      orderId = res.body.data.orderId;
      orderNumber = res.body.data.orderNumber;

      // Verify coupon usageCount incremented
      const coupon = await Coupon.findOne({ code: 'PROMO10' });
      expect(coupon?.usageCount).toBe(1);
    });

    it('should handle Xendit webhook payment confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
        .send({
          id: 'inv_mock123',
          external_id: orderNumber,
          status: 'PAID',
        });

      expect(res.status).toBe(200);

      // Verify Order status is PAID in DB
      const order = await Order.findById(orderId);
      expect(order?.status).toBe('paid');
      expect(order?.paymentStatus).toBe('paid');

      // Verify Product stock is decremented (10 - 3 = 7)
      const product = await Product.findById(productId);
      expect(product?.stock).toBe(7);

      // Verify customer's cart is cleared
      const cart = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cart.body.data.items.length).toBe(0);
    });

    it('should trigger low-stock alert if product stock falls below threshold', async () => {
      // 1. Force stock to 6, then run another purchase to drop it below 5
      await Product.findByIdAndUpdate(productId, { $set: { stock: 6 } });

      // Add 2 items to cart again
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 2 });

      // Checkout
      const checkRes = await request(app)
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId,
          shipping: { courier: 'jne', service: 'REG', cost: 15000 },
        });
      const orderNum2 = checkRes.body.data.orderNumber;

      // Webhook confirms payment
      await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
        .send({
          id: 'inv_mock456',
          external_id: orderNum2,
          status: 'PAID',
        });

      // Product stock: 6 - 2 = 4 (which is <= threshold 5)
      const product = await Product.findById(productId);
      expect(product?.stock).toBe(4);

      // Verify that low-stock notification is created for admin
      const adminNotif = await Notification.findOne({ type: 'low_stock' });
      expect(adminNotif).toBeDefined();
      expect(adminNotif?.body).toContain('iPhone 15 Pro Max');
    });
  });

  // ==========================================
  // ORDER STATUS TRANSITIONS
  // ==========================================
  describe('Order Status & State Machine Transitions', () => {
    it('should transition order status forward and prevent backward transitions', async () => {
      // 1. Current status: paid. Go to processing (Admin)
      const res1 = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });
      expect(res1.status).toBe(200);

      // 2. Go to shipped (requires tracking number and courier)
      const resShippedFail = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' });
      expect(resShippedFail.status).toBe(400); // validation refinement fails because courier & trackingNumber missing

      const res2 = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped', trackingNumber: 'JNE12345678', courier: 'jne' });
      expect(res2.status).toBe(200);
      expect(res2.body.data.status).toBe('shipped');
      expect(res2.body.data.trackingNumber).toBe('JNE12345678');

      // 3. Attempt to transition backward from shipped to processing
      const resBackward = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });
      expect(resBackward.status).toBe(422);
      expect(resBackward.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // ==========================================
  // ADMIN STOCK ADJUSTMENTS
  // ==========================================
  describe('Admin Stock Adjustment Logs', () => {
    it('should adjust product stock manually and record log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 80,
          reason: 'Correction from manual warehouse recount',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stock).toBe(80);

      // Verify log entry
      const log = await StockLog.findOne({ product: productId });
      expect(log).toBeDefined();
      expect(log?.reason).toBe('Correction from manual warehouse recount');
      expect(log?.quantityChanged).toBe(76); // New stock: 80, old stock: 4. Changed: 80 - 4 = 76
    });
  });
});
