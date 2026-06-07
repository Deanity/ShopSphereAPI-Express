# 🌌 ShopSphere API

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

ShopSphere API is a production-grade e-commerce backend built with Node.js/Express. It handles the full purchase lifecycle — from product catalog, cart, wishlist, checkout, payment processing (Xendit), order fulfillment, shipping (RajaOngkir), stock management, reviews/ratings, to email & in-app notifications.

---

## 🚀 Key Features

* **Authentication & Authorization**: Secure JWT-based registration, login, and token refresh stored in secure, HTTP-only cookies.
* **Product Catalog & Advanced Search**: Nested category trees, product query filtering, and MongoDB Atlas Search integration.
* **Cart & Wishlist Actions**: Cart item management (max 20 items) with product price snapshots and wishlist management.
* **Order & Checkout Lifecycle**: Coupon code discount validations, RajaOngkir shipping cost calculations, placing orders, generating Xendit invoices, and processing payment webhooks.
* **Inventory Management**: Automated stock decrements upon payment confirmation, low-stock alerts, and manual adjustments logs.
* **Ratings & Reviews**: Verified purchase checks (order must be delivered) with automatic product rating aggregation.
* **Automated Notifications**: Transactional emails (invoices, order shipping alerts) via Resend and in-app notifications.
* **Return & Refund Requests**: Return request management within 7 days of delivery and stock restoration.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Language & Runtime** | TypeScript (strict mode) + Node.js (ES Modules) |
| **Web Framework** | Express.js |
| **Database** | MongoDB (via Mongoose ODM) |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **Payment Gateway** | Xendit (sandbox → production via env var) |
| **Email Service** | Resend |
| **Shipping Gateway** | RajaOngkir API |
| **Search Engine** | MongoDB Atlas Search |
| **Validation** | Zod |
| **Testing** | Vitest + Supertest |
| **Package Manager** | pnpm |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20 or higher)
- pnpm (v9 or higher)
- MongoDB instance (Local or Atlas)

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

4. **Required variables in `.env`:**
   ```ini
   # App
   NODE_ENV=development
   PORT=5000
   APP_URL=http://localhost:5000

   # MongoDB
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/shopsphere

   # JWT
   JWT_ACCESS_SECRET=your_access_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Xendit (Sandbox)
   XENDIT_SECRET_KEY=xnd_development_...
   XENDIT_CALLBACK_TOKEN=your_xendit_callback_token
   XENDIT_WEBHOOK_URL=https://your-domain.com/api/v1/payments/webhook

   # Resend
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@yourdomain.com

   # RajaOngkir
   RAJAONGKIR_API_KEY=your_rajaongkir_key
   RAJAONGKIR_ORIGIN_CITY_ID=your_origin_city_id
   ```

---

## 💻 Running the Application

### Development Server
Starts the server with hot-reloading using `tsx watch`:
```bash
pnpm dev
```
Once started, test the health check endpoint:
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

### Running Tests
Vitest is configured to run tests inside isolated project configurations:
```bash
# Run all tests
pnpm test

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

## 📂 Project Architecture

The codebase utilizes a **domain-driven, feature-based** directory structure under `src/`:

```
src/
├── config/           # Database connections, seeders, and configurations
├── middlewares/      # Express middlewares (errorHandler, validation, auth)
├── modules/          # Business domains (auth, products, categories, cart, orders, etc.)
├── routes/           # Central route mounts and versions
├── types/            # Shared TypeScript definitions
└── utils/            # Helpers (formatResponse, AppError)
```