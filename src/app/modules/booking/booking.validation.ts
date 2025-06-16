import { z } from 'zod';

export const BookingValidations = {
  create: z.object({
    offerTitle: z.string(),
    offerDescription: z.string(),
    category: z.string(),
    subCategory: z.string(),
    user: z.string(),
    business: z.string(),
    request: z.string(),
    code: z.string(),
    status: z.string(),
  }),

  update: z.object({
    offerTitle: z.string().optional(),
    offerDescription: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    user: z.string().optional(),
    business: z.string().optional(),
    request: z.string().optional(),
    code: z.string().optional(),
    status: z.string().optional(),
  }),
};
