import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().url().default('http://localhost:5000'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  XENDIT_SECRET_KEY: z.string().min(1),
  XENDIT_CALLBACK_TOKEN: z.string().min(1),
  XENDIT_WEBHOOK_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  RAJAONGKIR_API_KEY: z.string().min(1),
  RAJAONGKIR_ORIGIN_CITY_ID: z.coerce.number().default(501),
  LOW_STOCK_THRESHOLD: z.coerce.number().default(5),
  MAX_CART_ITEMS: z.coerce.number().default(20),
  RETURN_WINDOW_DAYS: z.coerce.number().default(7),
  PAYMENT_EXPIRY_HOURS: z.coerce.number().default(24),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
