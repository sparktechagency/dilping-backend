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
     type: z.enum(['accept', 'reject', 'cancel', 'completed']),
    }),
  }),
};
