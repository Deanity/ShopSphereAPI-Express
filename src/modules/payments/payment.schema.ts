import { z } from 'zod';

export const xenditWebhookSchema = z.object({
  body: z.object({
    id: z.string().min(1, 'Invoice ID is required'),
    external_id: z.string().min(1, 'External ID (order number) is required'),
    status: z.string().min(1, 'Status is required'),
    amount: z.coerce.number().optional(),
    paid_amount: z.coerce.number().optional(),
  }),
});
