import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const wishlistSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
  }),
});
