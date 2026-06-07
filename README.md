# 🌌 ShopSphere API

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

ShopSphere API is a production-grade, highly secure, and feature-complete e-commerce REST backend built using Node.js, Express.js, Mongoose, and TypeScript strict mode. It manages the full purchase lifecycle end-to-end without manual intervention — handling identity, dynamic catalogs, cart syncing, checkout calculations, payment callbacks (Xendit), shipping costs (RajaOngkir), coupons, transactional emails (Resend), in-app notifications, product reviews, and returns.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Language & Runtime** | TypeScript (strict mode) + Node.js (ES Modules) |
| **Web Framework** | Express.js |
| **Database & ORM** | MongoDB + Mongoose ODM |
| **Authentication** | JWT (jsonwebtoken) + bcrypt (rounds: 12) |
| **Payment Gateway** | Xendit API (Sandbox / Production) |
| **Email Gateway** | Resend SDK (HTML templates with responsive layout) |
| **Shipping Gateway** | RajaOngkir Starter API |
| **Search Engine** | MongoDB Atlas Search (text index on name, description, tags) |
| **Input Validation** | Zod |
| **Testing Engine** | Vitest + Supertest + MongoDB Memory Server |
| **Package Manager** | pnpm |

---

## 🚀 Key Features & Business Rules

### 1. Identity & Auth (Phase 1)
* **Double Tokens**: Access token (expires 15m) + Refresh token (expires 7d) stored in a secure `httpOnly` cookie.
* **Password Reset**: Generates a secure, 1-hour time-limited token sent via email, invalidated immediately on use.
* **Address Book**: Multi-address profiles with a single default address flag.

### 2. E-Commerce Purchase Flow (Phase 2)
* **Cart Logic**: Enforces a limit of 20 unique products (`MAX_CART_ITEMS`). Automatically syncs and checks product price/availability on `GET /cart`.
* **Coupons**: Validates 6 business rules (active status, start/end dates, global limit, min order amount, applicable products/categories, and user usage count limit).
* **RajaOngkir Cost Integration**: Denpasar, Bali (`Origin City ID: 114`) is configured as the shipping origin. Real-time cost comparisons are made during checkout with zero cost-tolerance.
* **Checkout Rollback**: Invoices are generated on Xendit. If invoice creation fails, the order document is automatically rolled back (deleted) to prevent database discrepancies.
* **Webhook Settlement**: Payment confirmed webhooks verify the callback token header, atomically decrement product stock, clear the user's cart, and log anomalies if stock is depleted at payment time.

### 3. Communication Layer (Phase 3)
* **Resend Emails**: Transactional emails dispatch HTML templates for order placement, invoice receipts, shipping tracking, delivery notices, return resolutions, and password resets.
* **In-App Notifications**: Alerts are triggered automatically for payment successes, shipments, low-stock warnings (for admins, threshold: 5), and returns. Endpoint controllers support pagination and unread counts.

### 4. Post-Purchase & Quality (Phase 4)
* **Product Reviews**: Customer can review products only after the order is marked `DELIVERED`. Enforces a strict one-review-per-product-per-order compound index. Atomically aggregates and recalculates the product's `averageRating` and `totalReviews`.
* **Return Requests**: Requests must be submitted within 7 days of delivery. Ensures return item quantities do not exceed original order quantities. If approved, order status transitions to `REFUNDED` and product stocks are automatically restored.
* **Admin Dashboard**: Exposes stores metrics (total orders, total revenue, low-stock item count, and pending return count).

---

## 📂 Project Structure

The codebase utilizes a **domain-driven, feature-based** directory structure under `src/`:

```
shopsphere-api/
  src/
    config/           # DB connection, environment configuration, database seeders
    middlewares/      # Auth security guards, global error handler, zod validations
    modules/
      auth/           # Registration, login, token refresh, forgot/reset password
      users/          # Profiles and address book management
      admin/          # Dashboard stats and user account activations
      products/       # Catalog CRUD, search filters, Atlas Search indexes
      categories/     # Multi-level hierarchical categories tree
      cart/           # Shopping cart item and quantity operations
      wishlist/       # Wishlists addition and removal
      checkout/       # Subtotal/shipping cost calculation & Xendit invoices
      orders/         # History, details, and order status state machine transitions
      stock/          # Admin stock adjustments and stock logs
      payments/       # Xendit callback webhooks
      reviews/        # Verified reviews and rating aggregation
      emails/         # Resend templates and sender wrapper
      notifications/  # In-app alerts query and updates
      coupons/        # Coupon validation and admin CRUD
      shipping/       # RajaOngkir province/city lists and shipping cost calculators
    routes/           # Central route mounting
    types/            # Shared TypeScript type definitions
    utils/            # Standard response formatters and AppError classes
```

---

## 📋 API Endpoints Reference

All routes are versioned and prefixed under `/api/v1/`.

### Auth & User Profile
* `POST /auth/register` - Create customer account
* `POST /auth/login` - Authenticate user (sets refresh token cookie)
* `POST /auth/refresh-token` - Retrieve new access token
* `POST /auth/logout` - Clear refresh cookie
* `POST /auth/forgot-password` - Request a password reset email link
* `POST /auth/reset-password/:token` - Set new password using token
* `GET /users/me` - Retrieve current user profile
* `PATCH /users/me` - Update profile details
* `POST /users/me/addresses` - Add address to profile
* `PATCH /users/me/addresses/:id` - Update specific address
* `DELETE /users/me/addresses/:id` - Delete address
* `PATCH /users/me/addresses/:id/set-default` - Set default shipping address

### Catalog & Categories
* `GET /categories` - Retrieve category tree list
* `GET /categories/:slug` - Get specific category details
* `GET /products` - Query products list (supports search, sort, category & price filters)
* `GET /products/:slug` - Fetch specific product details

### Cart & Wishlist
* `GET /cart` - Retrieve user's cart (syncs prices and flags items availability)
* `POST /cart/items` - Add product item to cart
* `PATCH /cart/items/:productId` - Update item quantity in cart
* `DELETE /cart/items/:productId` - Remove item from cart
* `DELETE /cart` - Clear all cart items
* `GET /wishlist` - Retrieve wishlist products
* `POST /wishlist/items` - Add product to wishlist
* `DELETE /wishlist/items/:productId` - Remove product from wishlist

### Checkout, Shipping, & Coupons
* `GET /shipping/provinces` - Fetch province lists (cached 24h)
* `GET /shipping/cities` - Fetch city lists matching province (cached 24h)
* `POST /shipping/cost` - Compute courier cost based on weight
* `POST /coupons/validate` - Pre-check coupon eligibility and discount amount
* `POST /checkout` - Create order and retrieve Xendit invoice URL
* `POST /payments/webhook` - Xendit invoice payment, expiration, or failure callback

### Order Management, Reviews, & Returns
* `GET /orders` - Fetch customer order history
* `GET /orders/:id` - Retrieve specific order details
* `GET /products/:id/reviews` - Fetch public product reviews (paginated)
* `POST /products/:id/reviews` - Post a verified product review (order must be delivered)
* `POST /returns` - Submit return request (within 7 days of delivery)
* `GET /returns` - Fetch own return request logs
* `GET /returns/:id` - Fetch return request details
* `GET /notifications` - Fetch in-app notifications and unread count
* `PATCH /notifications/:id/read` - Mark specific notification read
* `PATCH /notifications/read-all` - Mark all notifications read

### Admin-Only Endpoints
* `POST /admin/categories` - Create new category
* `PATCH /admin/categories/:id` - Update category
* `DELETE /admin/categories/:id` - Delete category
* `POST /admin/products` - Create new product
* `PATCH /admin/products/:id` - Update product details
* `DELETE /admin/products/:id` - Soft delete product
* `PATCH /admin/products/:id/stock` - Adjust product stock manually (creates log)
* `POST /admin/coupons` - Create coupon
* `GET /admin/coupons` - Retrieve coupon logs
* `PATCH /admin/coupons/:id` - Update coupon details
* `DELETE /admin/coupons/:id` - Delete coupon
* `GET /admin/orders` - Query all orders
* `PATCH /admin/orders/:id/status` - Transition order status (Paid -> Processing -> Shipped -> Delivered)
* `GET /admin/returns` - Query all return requests
* `PATCH /admin/returns/:id/status` - Resolve return request (approve / reject)
* `DELETE /admin/reviews/:id` - Delete product review (recalculates product average rating)
* `GET /admin/users` - List all registered user profiles (search & paginate)
* `PATCH /admin/users/:id/status` - Activate / deactivate user account
* `GET /admin/stats` - Fetch overall store statistics

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20 or higher)
- pnpm (v9 or higher)
- MongoDB instance (Local or Atlas Cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Deanity/ShopSphereAPI-Express.git
   cd ShopSphereAPI
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Copy the template and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Verify `.env` configuration:**
   ```ini
   # App
   NODE_ENV=development
   PORT=5000
   APP_URL=http://localhost:5000

   # MongoDB
   MONGODB_URI=your_mongodb_connection_string

   # JWT
   JWT_ACCESS_SECRET=your_access_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Xendit (Sandbox)
   XENDIT_SECRET_KEY=xnd_development_...
   XENDIT_CALLBACK_TOKEN=your_xendit_callback_token
   XENDIT_WEBHOOK_URL=http://localhost:5000/api/v1/payments/webhook

   # Resend
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=onboarding@resend.dev

   # RajaOngkir
   RAJAONGKIR_API_KEY=your_rajaongkir_key
   RAJAONGKIR_ORIGIN_CITY_ID=114 # Denpasar origin

   # Business Config
   LOW_STOCK_THRESHOLD=5
   MAX_CART_ITEMS=20
   RETURN_WINDOW_DAYS=7
   PAYMENT_EXPIRY_HOURS=24
   ```

---

## 💻 Running the Application

### Development Server
Starts the server with hot-reloading using `tsx watch`:
```bash
pnpm dev
```
Test the health check endpoint to confirm setup:
- **Health check URL**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### Production Build
Compile TypeScript to `dist/` and run the production build:
```bash
pnpm build
pnpm start
```

### Database Seeding
```bash
# Seed initial data (categories, admin user, sample products)
pnpm db:seed

# Drop all collections and re-seed
pnpm db:reset
```

---

## 🧪 Running Tests

Vitest is configured to run tests inside isolated project configurations (using an in-memory MongoDB Server for speed and reliability, and mocks for external APIs).

```bash
# Run all tests
pnpm exec vitest run

# Run unit tests only
pnpm test:unit

# Run integration/E2E tests only
pnpm test:e2e
```

### Code Quality
Lint and format checking:
```bash
pnpm lint        # Run ESLint rules
pnpm lint:fix    # Auto-fix lint issues
pnpm format      # Run Prettier formatting
```

---

## 👥 Credits & Contact

<div align="left">
  <a href="https://www.instagram.com/shoyou.nt/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Instagram&logo=instagram&label=&color=E4405F&logoColor=white&labelColor=&style=for-the-badge" height="35" alt="instagram logo" />
  </a>
  <a href="https://discord.com/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Discord&logo=discord&label=&color=7289DA&logoColor=white&labelColor=&style=for-the-badge" height="35" alt="discord logo" />
  </a>
  <a href="mailto:dendradetama2@gmail.com" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Gmail&logo=gmail&label=&color=D14836&logoColor=white&labelColor=&style=for-the-badge" height="35" alt="gmail logo" />
  </a>
  <a href="https://www.linkedin.com/in/dendra-de-tama/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=LinkedIn&logo=linkedin&label=&color=0077B5&logoColor=white&labelColor=&style=for-the-badge" height="35" alt="linkedin logo" />
  </a>
</div>

<br/>

<div align="center">
  <i>"Code is art. Make it beautiful."</i> — De4nity
</div>