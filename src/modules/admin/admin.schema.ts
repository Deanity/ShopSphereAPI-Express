import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const toggleUserStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema, // userId
  }),
  body: z.object({
    isActive: z.boolean({
      required_error: 'isActive status is required',
    }),
  }),
});

export const queryUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => Math.max(1, parseInt(val || '1') || 1)),
    limit: z.string().optional().transform((val) => Math.max(1, parseInt(val || '20') || 20)),
    search: z.string().optional(),
    role: z.enum(['customer', 'admin', 'all']).optional().default('all'),
  }),
});
