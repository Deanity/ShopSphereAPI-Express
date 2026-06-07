import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    parent: objectIdSchema.nullable().optional(),
    image: z.string().url('Invalid image URL').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name cannot be empty').optional(),
    parent: objectIdSchema.nullable().optional(),
    image: z.string().url('Invalid image URL').optional(),
    isActive: z.boolean().optional(),
  }),
});
