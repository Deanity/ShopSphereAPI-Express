import { Router } from 'express';

// Middlewares
import { requireAuth, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

// Controllers
import { AuthController } from '../modules/auth/auth.controller.js';
import { UserController } from '../modules/users/user.controller.js';
import { CategoryController } from '../modules/categories/category.controller.js';
import { ProductController } from '../modules/products/product.controller.js';
import { CartController } from '../modules/cart/cart.controller.js';
import { WishlistController } from '../modules/wishlist/wishlist.controller.js';
import { ShippingController } from '../modules/shipping/shipping.controller.js';
import { CouponController } from '../modules/coupons/coupon.controller.js';
import { CheckoutController } from '../modules/checkout/checkout.controller.js';
import { PaymentController } from '../modules/payments/payment.controller.js';
import { OrderController } from '../modules/orders/order.controller.js';
import { StockController } from '../modules/stock/stock.controller.js';
import { NotificationController } from '../modules/notifications/notification.controller.js';

// Schemas
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../modules/auth/auth.schema.js';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../modules/users/user.schema.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../modules/categories/category.schema.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
} from '../modules/products/product.schema.js';
import {
  addToCartSchema,
  updateQuantitySchema,
} from '../modules/cart/cart.schema.js';
import {
  wishlistSchema,
} from '../modules/wishlist/wishlist.schema.js';
import {
  calculateCostSchema,
} from '../modules/shipping/shipping.schema.js';
import {
  validateCouponSchema,
  createCouponSchema,
  updateCouponSchema,
} from '../modules/coupons/coupon.schema.js';
import {
  checkoutSchema,
} from '../modules/checkout/checkout.schema.js';
import {
  xenditWebhookSchema,
} from '../modules/payments/payment.schema.js';
import {
  updateOrderStatusSchema,
} from '../modules/orders/order.schema.js';
import {
  adjustStockSchema,
} from '../modules/stock/stock.schema.js';
import {
  markReadSchema,
} from '../modules/notifications/notification.schema.js';

const router = Router();

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/register', validateRequest(registerSchema), AuthController.register);
router.post('/auth/login', validateRequest(loginSchema), AuthController.login);
router.post('/auth/refresh-token', AuthController.refreshToken);
router.post('/auth/logout', AuthController.logout);
router.post(
  '/auth/forgot-password',
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  '/auth/reset-password/:token',
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword,
);

// ==========================================
// USER ROUTES (Protected)
// ==========================================
router.get('/users/me', requireAuth, UserController.getMe);
router.patch(
  '/users/me',
  requireAuth,
  validateRequest(updateProfileSchema),
  UserController.updateMe,
);
router.post(
  '/users/me/addresses',
  requireAuth,
  validateRequest(createAddressSchema),
  UserController.addAddress,
);
router.patch(
  '/users/me/addresses/:id',
  requireAuth,
  validateRequest(updateAddressSchema),
  UserController.updateAddress,
);
router.delete('/users/me/addresses/:id', requireAuth, UserController.deleteAddress);
router.patch('/users/me/addresses/:id/set-default', requireAuth, UserController.setDefaultAddress);

// ==========================================
// CATEGORY ROUTES
// ==========================================
// Public
router.get('/categories', CategoryController.getTree);
router.get('/categories/:slug', CategoryController.getBySlug);

// Admin Only
router.post(
  '/admin/categories',
  requireAuth,
  restrictTo('admin'),
  validateRequest(createCategorySchema),
  CategoryController.create,
);
router.patch(
  '/admin/categories/:id',
  requireAuth,
  restrictTo('admin'),
  validateRequest(updateCategorySchema),
  CategoryController.update,
);
router.delete('/admin/categories/:id', requireAuth, restrictTo('admin'), CategoryController.delete);

// ==========================================
// PRODUCT ROUTES
// ==========================================
// Public
router.get('/products', validateRequest(queryProductsSchema), ProductController.getProducts);
router.get('/products/:slug', ProductController.getBySlug);

// Admin Only
router.post(
  '/admin/products',
  requireAuth,
  restrictTo('admin'),
  validateRequest(createProductSchema),
  ProductController.create,
);
router.patch(
  '/admin/products/:id',
  requireAuth,
  restrictTo('admin'),
  validateRequest(updateProductSchema),
  ProductController.update,
);
router.delete('/admin/products/:id', requireAuth, restrictTo('admin'), ProductController.delete);

// ==========================================
// CART ROUTES (Protected)
// ==========================================
router.get('/cart', requireAuth, CartController.getCart);
router.post('/cart/items', requireAuth, validateRequest(addToCartSchema), CartController.addItem);
router.patch(
  '/cart/items/:productId',
  requireAuth,
  validateRequest(updateQuantitySchema),
  CartController.updateQuantity,
);
router.delete('/cart/items/:productId', requireAuth, CartController.removeItem);
router.delete('/cart', requireAuth, CartController.clearCart);

// ==========================================
// WISHLIST ROUTES (Protected)
// ==========================================
router.get('/wishlist', requireAuth, WishlistController.getWishlist);
router.post('/wishlist/items', requireAuth, validateRequest(wishlistSchema), WishlistController.addItem);
router.delete('/wishlist/items/:productId', requireAuth, WishlistController.removeItem);

// ==========================================
// SHIPPING ROUTES (Public / Protected)
// ==========================================
router.get('/shipping/provinces', requireAuth, ShippingController.getProvinces);
router.get('/shipping/cities', requireAuth, ShippingController.getCities);
router.post('/shipping/cost', requireAuth, validateRequest(calculateCostSchema), ShippingController.calculateCost);

// ==========================================
// COUPON ROUTES (Protected)
// ==========================================
router.post('/coupons/validate', requireAuth, validateRequest(validateCouponSchema), CouponController.validateCoupon);

// Admin Only
router.post(
  '/admin/coupons',
  requireAuth,
  restrictTo('admin'),
  validateRequest(createCouponSchema),
  CouponController.create,
);
router.get('/admin/coupons', requireAuth, restrictTo('admin'), CouponController.getCoupons);
router.patch(
  '/admin/coupons/:id',
  requireAuth,
  restrictTo('admin'),
  validateRequest(updateCouponSchema),
  CouponController.update,
);
router.delete('/admin/coupons/:id', requireAuth, restrictTo('admin'), CouponController.delete);

// ==========================================
// CHECKOUT ROUTES (Protected)
// ==========================================
router.post('/checkout', requireAuth, validateRequest(checkoutSchema), CheckoutController.checkout);

// ==========================================
// PAYMENT WEBHOOK ROUTE (Public)
// ==========================================
router.post('/payments/webhook', validateRequest(xenditWebhookSchema), PaymentController.handleXenditWebhook);

// ==========================================
// ORDER ROUTES (Protected)
// ==========================================
router.get('/orders', requireAuth, OrderController.getMyOrders);
router.get('/orders/:id', requireAuth, OrderController.getOrderById);

// Admin Only
router.get('/admin/orders', requireAuth, restrictTo('admin'), OrderController.getAllOrdersAdmin);
router.patch(
  '/admin/orders/:id/status',
  requireAuth,
  restrictTo('admin'),
  validateRequest(updateOrderStatusSchema),
  OrderController.updateOrderStatusAdmin,
);

// ==========================================
// STOCK ROUTES (Admin Only)
// ==========================================
router.patch(
  '/admin/products/:id/stock',
  requireAuth,
  restrictTo('admin'),
  validateRequest(adjustStockSchema),
  StockController.adjustStock,
);

// ==========================================
// NOTIFICATION ROUTES (Protected)
// ==========================================
router.get('/notifications', requireAuth, NotificationController.getNotifications);
router.patch(
  '/notifications/:id/read',
  requireAuth,
  validateRequest(markReadSchema),
  NotificationController.markAsRead,
);
router.patch('/notifications/read-all', requireAuth, NotificationController.markAllAsRead);

export { router as indexRouter };
