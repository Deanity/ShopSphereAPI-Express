import { z } from 'zod';

export const adjustStockSchema = z.object({
  body: z.object({
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    reason: z.string().min(1, 'Reason for adjustment is required'),
  }),
});
