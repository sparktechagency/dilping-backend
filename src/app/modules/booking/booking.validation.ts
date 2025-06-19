import { z } from 'zod';

export const BookingValidations = {
  create: z.object({
    body: z.object({
      offerTitle: z.string(),
      offerDescription: z.string(),
      category: z.string(),
      subCategories: z.array(z.string()),
      business: z.string(),
      request: z.string(),
      code: z.string(),
    }),
  }),

  update: z.object({
    body: z.object({
      offerTitle: z.string().optional(),
      offerDescription: z.string().optional(),
      category: z.string().optional(),
      subCategories: z.array(z.string()).optional(),
      business: z.string().optional(),
      request: z.string().optional(),
      code: z.string().optional(),
    }),
  }),
};
