import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId',
});

export const createReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema, // productId
  }),
  body: z.object({
    orderId: objectIdSchema,
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(1, 'Comment is required'),
    images: z.array(z.string().url('Image must be a valid URL')).optional().default([]),
  }),
});

export const queryReviewsSchema = z.object({
  params: z.object({
    id: objectIdSchema, // productId
  }),
  query: z.object({
    page: z.string().optional().transform((val) => Math.max(1, parseInt(val || '1') || 1)),
    limit: z.string().optional().transform((val) => Math.max(1, parseInt(val || '10') || 10)),
  }),
});

export const deleteReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema, // reviewId
  }),
});
