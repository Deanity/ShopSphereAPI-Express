import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Product description is required'),
    price: z.number().min(0, 'Price must be positive'),
    discountPercent: z
      .number()
      .min(0)
      .max(100, 'Discount percent must be between 0 and 100')
      .optional()
      .default(0),
    images: z
      .array(z.string().url('Invalid image URL'))
      .min(1, 'At least one product image is required'),
    category: objectIdSchema,
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    weight: z.number().min(0, 'Weight must be positive'), // in grams
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name cannot be empty').optional(),
    description: z.string().min(1, 'Product description cannot be empty').optional(),
    price: z.number().min(0, 'Price must be positive').optional(),
    discountPercent: z
      .number()
      .min(0)
      .max(100, 'Discount percent must be between 0 and 100')
      .optional(),
    images: z
      .array(z.string().url('Invalid image URL'))
      .min(1, 'At least one product image is required')
      .optional(),
    category: objectIdSchema.optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    weight: z.number().min(0, 'Weight must be positive').optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const queryProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categoryId: objectIdSchema.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    inStockOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    sort: z
      .enum(['relevance', 'price_asc', 'price_desc', 'newest', 'best_selling'])
      .default('relevance'),
  }),
});
