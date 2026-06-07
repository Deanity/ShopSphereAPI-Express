import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const checkoutSchema = z.object({
  body: z.object({
    addressId: objectIdSchema,
    shipping: z.object({
      courier: z.enum(['jne', 'pos', 'tiki']),
      service: z.string().min(1, 'Shipping service is required'),
      cost: z.number().min(0, 'Shipping cost must be positive'),
    }),
    couponCode: z.string().toUpperCase().trim().optional(),
    notes: z.string().optional(),
  }),
});
