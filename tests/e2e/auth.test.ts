import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/modules/users/user.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Phase 1 E2E Integration Tests', () => {
  let customerToken: string;
  let adminToken: string;
  let adminUserId: string;
  let categoryId: string;
  let addressId: string;
  let productSlug: string;
  let productId: string;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Spin up MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Cleanup and close
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // ==========================================
  // AUTHENTICATION & REGISTRATION
  // ==========================================
  describe('Authentication', () => {
    it('should successfully register a customer', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      customerToken = res.body.data.accessToken;
    });

    it('should throw an error for duplicate emails on registration', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Duplicate',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should successfully log in the customer', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      customerToken = res.body.data.accessToken;
    });

    it('should successfully register and login an admin user', async () => {
      // Create admin user directly in DB
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      adminUserId = adminUser._id.toString();

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.accessToken;
    });
  });

  // ==========================================
  // USER PROFILE & ADDRESS MANAGEMENT
  // ==========================================
  describe('User Profile & Addresses', () => {
    it('should retrieve own profile info', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('jane@example.com');
    });

    it('should successfully add an address', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Home',
          recipientName: 'Jane Doe',
          phone: '08123456789',
          province: 'Jawa Barat',
          city: 'Bandung',
          district: 'Coblong',
          postalCode: '40132',
          fullAddress: 'Jl. Dago No. 10',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].label).toBe('Home');
      expect(res.body.data[0].isDefault).toBe(true);

      addressId = res.body.data[0]._id;
    });

    it('should successfully add a second address and set default correctly', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Office',
          recipientName: 'Jane Doe',
          phone: '08123456789',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          district: 'Kebayoran Baru',
          postalCode: '12110',
          fullAddress: 'Sudirman Tower Lt. 5',
          isDefault: true, // This should set 'Home' to isDefault = false
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(2);

      const home = res.body.data.find((a: any) => a.label === 'Home');
      const office = res.body.data.find((a: any) => a.label === 'Office');

      expect(home.isDefault).toBe(false);
      expect(office.isDefault).toBe(true);
    });

    it('should update address fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/me/addresses/${addressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Home Sweet Home',
          fullAddress: 'Jl. Dago No. 12',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data.find((a: any) => a._id === addressId);
      expect(updated.label).toBe('Home Sweet Home');
      expect(updated.fullAddress).toBe('Jl. Dago No. 12');
    });

    it('should toggle default address back to Home', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/me/addresses/${addressId}/set-default`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      const home = res.body.data.find((a: any) => a._id === addressId);
      expect(home.isDefault).toBe(true);
    });
  });

  // ==========================================
  // CATEGORIES MANAGEMENT
  // ==========================================
  describe('Category Management', () => {
    it('should block non-admins from creating a category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Electronics',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow admins to create a category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Electronics');
      expect(res.body.data.slug).toBe('electronics');

      categoryId = res.body.data._id;
    });

    it('should retrieve category tree', async () => {
      // Create subcategory
      await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Smartphones',
          parent: categoryId,
        });

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Electronics');
      expect(res.body.data[0].children.length).toBe(1);
      expect(res.body.data[0].children[0].name).toBe('Smartphones');
    });
  });

  // ==========================================
  // PRODUCT CATALOG & SEARCH
  // ==========================================
  describe('Product Management', () => {
    it('should allow admin to create a product', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'iPhone 15 Pro',
          description: 'Latest model with titanium chassis',
          price: 20000000,
          discountPercent: 10,
          images: ['https://example.com/iphone.png'],
          category: categoryId,
          stock: 50,
          weight: 187,
          tags: ['apple', 'phone', 'ios'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('iPhone 15 Pro');
      expect(res.body.data.slug).toBe('iphone-15-pro');
      expect(res.body.data.discountedPrice).toBe(18000000); // virtual field

      productSlug = res.body.data.slug;
      productId = res.body.data._id;
    });

    it('should fetch product by slug', async () => {
      const res = await request(app).get(`/api/v1/products/${productSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('iPhone 15 Pro');
      expect(res.body.data.category.name).toBe('Electronics');
    });

    it('should support querying with search, filtering, and sorting', async () => {
      // Create another product
      await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Samsung Galaxy S24',
          description: 'Flagship Android phone',
          price: 15000000,
          discountPercent: 5,
          images: ['https://example.com/s24.png'],
          category: categoryId,
          stock: 0, // Out of stock
          weight: 196,
          tags: ['samsung', 'phone', 'android'],
        });

      // Query active products (inStockOnly=true)
      const res = await request(app).get('/api/v1/products').query({
        search: 'phone',
        inStockOnly: 'true',
        sort: 'price_desc',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // Only iPhone is in stock
      expect(res.body.data[0].name).toBe('iPhone 15 Pro');
      expect(res.body.meta.total).toBe(1);
    });

    it('should soft delete product', async () => {
      // Admin deletes product
      const delRes = await request(app)
        .delete(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Verify customer can no longer query it
      const getRes = await request(app).get(`/api/v1/products/${productSlug}`);
      expect(getRes.status).toBe(404);
    });
  });
});
