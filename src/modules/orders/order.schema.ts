import { z } from 'zod';
import { OrderStatus } from './order.model.js';

export const updateOrderStatusSchema = z.object({
  body: z
    .object({
      status: z.enum([
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
      ]),
      trackingNumber: z.string().optional(),
      courier: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.status === OrderStatus.SHIPPED) {
          return !!data.trackingNumber && !!data.courier;
        }
        return true;
      },
      {
        message: 'Courier and trackingNumber are required when status is shipped',
        path: ['trackingNumber'],
      },
    ),
});
