import { z } from 'zod'

export const OfferValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string(),
      discount: z.number(),
      // status: z.enum(['active', 'inactive']), // Assuming 'active' and 'inactive' are the valid statuses for an offer
      // default: z.boolean(),
    }),
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      discount: z.number().optional(),
      status: z.enum(['active', 'inactive']).optional(), // Assuming 'active' and 'inactive' are the valid statuses for an offer
      default: z.boolean().optional(),
    }),
  }),
}
