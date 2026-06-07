import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    phone: z.string().optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
  }),
});

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label is required'),
    recipientName: z.string().min(1, 'Recipient name is required'),
    phone: z.string().min(1, 'Phone is required'),
    province: z.string().min(1, 'Province is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    fullAddress: z.string().min(1, 'Full address is required'),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label cannot be empty').optional(),
    recipientName: z.string().min(1, 'Recipient name cannot be empty').optional(),
    phone: z.string().min(1, 'Phone cannot be empty').optional(),
    province: z.string().min(1, 'Province cannot be empty').optional(),
    city: z.string().min(1, 'City cannot be empty').optional(),
    district: z.string().min(1, 'District cannot be empty').optional(),
    postalCode: z.string().min(1, 'Postal code cannot be empty').optional(),
    fullAddress: z.string().min(1, 'Full address cannot be empty').optional(),
    isDefault: z.boolean().optional(),
  }),
});
