import { z } from 'zod';
import mongoose from 'mongoose';
import { ReturnReason, ReturnStatus } from './return.model.js';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

const returnItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Item return reason is required'),
});

export const createReturnSchema = z.object({
  body: z.object({
    orderId: objectIdSchema,
    items: z.array(returnItemSchema).min(1, 'At least one item must be returned'),
    reason: z.nativeEnum(ReturnReason, {
      errorMap: () => ({ message: 'Invalid return reason' }),
    }),
    description: z.string().min(1, 'Description is required'),
    images: z.array(z.string().url('Image must be a valid URL')).optional().default([]),
  }),
});

export const resolveReturnSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.enum([ReturnStatus.APPROVED, ReturnStatus.REJECTED], {
      errorMap: () => ({ message: 'Status must be either approved or rejected' }),
    }),
    refundAmount: z.number().nonnegative('Refund amount must be a positive number or 0').default(0),
    adminNotes: z.string().optional(),
  }),
});

export const getReturnSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
