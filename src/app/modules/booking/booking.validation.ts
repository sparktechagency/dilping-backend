import { z } from 'zod';

export const BookingValidations = {
  create: z.object({
    body: z.object({
      offerTitle: z.string({ required_error: 'Offer title is required' }),
      offerDescription: z.string().optional(),
      business: z.string({ required_error: 'Business id is required' }),
      request: z.string({ required_error: 'Request id is required' }),
      chat: z.string({ required_error: 'Chat id is required' }),
    }),
  }),

  update: z.object({
    body: z.object({
     type: z.enum(['accept', 'reject', 'cancel', 'completed']),
    }),
  }),
};

