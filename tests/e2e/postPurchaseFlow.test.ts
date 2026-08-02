import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Order, OrderStatus } from '../../src/modules/orders/order.model.js';
import { Return, ReturnStatus } from '../../src/modules/returns/return.model.js';
import { Review } from '../../src/modules/reviews/review.model.js';
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

describe('Phase 4 E2E Integration Tests Post-Purchase & Quality', () => {
  let mongoServer: MongoMemoryServer;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let adminUserId: string;

  let categoryId: string;
  let productId: string;
  let addressId: string;
  let orderId: string;
  let orderNumber: string;
  let returnId: string;
  let reviewId: string;

  beforeAll(async () => {
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

    // 1. Register customer
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Dendra Customer',
      email: 'dendra@example.com',
      password: 'password123',
    });
    customerToken = regRes.body.data.accessToken;
    customerId = regRes.body.data.user._id;

    // 2. Register admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
    });
    adminUserId = adminUser._id.toString();

    const loginAdminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = loginAdminRes.body.data.accessToken;

    // 3. Create address
    const addrRes = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        label: 'Rumah',
        recipientName: 'Dendra Customer',
        phone: '08123456789',
        province: 'Bali',
        city: 'Denpasar',
        district: 'Denpasar Barat',
        postalCode: '80117',
        fullAddress: 'Jl. Teuku Umar No. 12',
      });
    addressId = addrRes.body.data[0]._id;

    // 4. Create Category & Product
    const category = await Category.create({
      name: 'Pakaian Pria',
      slug: 'pakaian-pria',
      isActive: true,
    });
    categoryId = category._id.toString();

    const product = await Product.create({
      name: 'Kaos Hitam Polos',
      slug: 'kaos-hitam-polos',
      description: 'Kaos polos premium combed 30s',
      price: 100000,
      discountPercent: 0,
      images: ['https://images.com/kaos.jpg'],
      category: category._id,
      stock: 50,
      weight: 200,
      sold: 0,
      averageRating: 0,
      totalReviews: 0,
      isActive: true,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Order Lifecycle Setup (Pre-requisite for Reviews/Returns)', () => {
    it('should successfully buy the product and transition status to DELIVERED', async () => {
      // Add product to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId, quantity: 2 });

      // Checkout
      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId,
          shipping: { courier: 'jne', service: 'REG', cost: 15000 },
        });

      expect(checkoutRes.status).toBe(201);
      orderId = checkoutRes.body.data.orderId;
      orderNumber = checkoutRes.body.data.orderNumber;

      // Simulate payment SUCCESS via webhook
      const webhookRes = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-callback-token', env.XENDIT_CALLBACK_TOKEN)
        .send({
          id: 'inv_123',
          external_id: orderNumber,
          status: 'PAID',
          amount: 215000,
        });
      expect(webhookRes.status).toBe(200);

      // Verify order PAID
      let order = await Order.findById(orderId);
      expect(order?.status).toBe(OrderStatus.PAID);

      // Admin transitions status PAID -> PROCESSING
      await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });

      // Admin transitions status PROCESSING -> SHIPPED
      await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped', trackingNumber: 'JNE123456', courier: 'jne' });

      // Admin transitions status SHIPPED -> DELIVERED
      await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });

      // Verify order DELIVERED
      order = await Order.findById(orderId);
      expect(order?.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('Product Review API Endpoints', () => {
    it('should successfully submit a review for the delivered product', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 5,
          comment: 'Bahannya adem sekali, sangat puas!',
          images: ['https://images.com/review1.jpg'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      reviewId = res.body.data._id;

      // Verify averageRating recalculation
      const product = await Product.findById(productId);
      expect(product?.averageRating).toBe(5);
      expect(product?.totalReviews).toBe(1);
    });

    it('should block duplicate review submission for the same product and order', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 4,
          comment: 'Komentar kedua',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('REVIEW_ALREADY_EXISTS');
    });

    it('should retrieve public reviews for a product', async () => {
      const res = await request(app).get(`/api/v1/products/${productId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].comment).toBe('Bahannya adem sekali, sangat puas!');
      expect(res.body.data[0].user.name).toBe('Dendra Customer');
    });
  });

  describe('Return & Refund API Endpoints', () => {
    it('should successfully submit a return request', async () => {
      const res = await request(app)
        .post('/api/v1/returns')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          items: [{ productId, quantity: 1, reason: 'Kekecilan' }],
          reason: 'wrong_item',
          description: 'Ukuran kaos tidak sesuai dengan size chart',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ReturnStatus.PENDING);
      returnId = res.body.data._id;
    });

    it('should list return requests for the customer', async () => {
      const res = await request(app)
        .get('/api/v1/returns')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]._id).toBe(returnId);
    });

    it('should list all returns for the admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]._id).toBe(returnId);
    });

    it('should allow admin to resolve (approve) the return request and restore stock', async () => {
      const productBefore = await Product.findById(productId);
      const stockBefore = productBefore?.stock || 0;

      const res = await request(app)
        .patch(`/api/v1/admin/returns/${returnId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          refundAmount: 100000,
          adminNotes: 'Pengajuan disetujui, dana dikembalikan.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ReturnStatus.APPROVED);

      // Verify order is now REFUNDED
      const order = await Order.findById(orderId);
      expect(order?.status).toBe(OrderStatus.REFUNDED);

      // Verify stock is restored
      const productAfter = await Product.findById(productId);
      expect(productAfter?.stock).toBe(stockBefore + 1);
    });
  });

  describe('Admin Dashboard and User Management Endpoints', () => {
    it('should successfully toggle user status (deactivate user)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);

      const user = await User.findById(customerId);
      expect(user?.isActive).toBe(false);
    });

    it('should retrieve admin dashboard stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalOrders).toBe(1);
      expect(res.body.data.lowStockCount).toBeDefined();
      expect(res.body.data.pendingReturns).toBe(0); // resolved now
    });
  });
});
