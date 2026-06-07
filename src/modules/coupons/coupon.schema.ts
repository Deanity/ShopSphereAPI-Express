import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase().trim(),
    subtotal: z.number().min(0, 'Subtotal must be positive'),
  }),
});

export const createCouponSchema = z.object({
  body: z
    .object({
      code: z.string().min(1, 'Coupon code is required').toUpperCase().trim(),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().min(0, 'Value must be positive'),
      minOrderAmount: z.number().min(0, 'Minimum order amount must be positive').default(0),
      maxDiscountAmount: z.number().min(0, 'Maximum discount amount must be positive').optional(),
      usageLimit: z.number().int().min(1, 'Usage limit must be at least 1'),
      userUsageLimit: z.number().int().min(1, 'User usage limit must be at least 1').default(1),
      applicableProducts: z.array(objectIdSchema).optional().default([]),
      applicableCategories: z.array(objectIdSchema).optional().default([]),
      startDate: z.string().datetime('Invalid start date format'),
      endDate: z.string().datetime('Invalid end date format'),
      isActive: z.boolean().optional().default(true),
    })
    .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
      message: 'Start date must be before end date',
      path: ['endDate'],
    }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code cannot be empty').toUpperCase().trim().optional(),
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().min(0, 'Value must be positive').optional(),
    minOrderAmount: z.number().min(0, 'Minimum order amount must be positive').optional(),
    maxDiscountAmount: z.number().min(0, 'Maximum discount amount must be positive').optional(),
    usageLimit: z.number().int().min(1, 'Usage limit must be at least 1').optional(),
    userUsageLimit: z.number().int().min(1, 'User usage limit must be at least 1').optional(),
    applicableProducts: z.array(objectIdSchema).optional(),
    applicableCategories: z.array(objectIdSchema).optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    isActive: z.boolean().optional(),
  }),
});
