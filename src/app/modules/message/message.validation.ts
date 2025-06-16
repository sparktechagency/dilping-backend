import { z } from 'zod'

export const MessageValidations = {
  create: z.object({
    body: z.object({
      receiver: z.string(),
      message: z.string().optional(),
      type: z.string().optional(),
      // offer: z.string().optional(),
      offerTitle: z.string().optional(),
      offerDescription: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      receiver: z.string().optional(),
      message: z.string().optional(),
      type: z.string().optional(),
      // offer: z.string().optional(),
      offerTitle: z.string().optional(),
      offerDescription: z.string().optional(),
    }),
  }),
}
