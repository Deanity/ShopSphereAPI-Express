import { z } from 'zod';

export const calculateCostSchema = z.object({
  body: z.object({
    destinationCityId: z.string().min(1, 'Destination city ID is required'),
    weight: z.number().int().min(1, 'Weight must be at least 1 gram'),
    courier: z.enum(['jne', 'pos', 'tiki']),
  }),
});
