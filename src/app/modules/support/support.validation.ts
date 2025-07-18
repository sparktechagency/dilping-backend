import { z } from 'zod';

export const SupportValidations = {
  create: z.object({
    body: z.object({
      category: z.string().optional(),
      subcategories: z.array(z.string()).optional(),
      businessName: z.string().optional(),
      eiin: z.string().optional(),
    }),
  }),

  update: z.object({
   body: z.object({
    status: z.enum([ 'approved', 'rejected']),
   }),
  }),
};
