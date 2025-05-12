import { z } from 'zod'

export const MessageValidations = {
  create: z.object({
    body: z.object({
      user: z.string(),
      business: z.string(),
      message: z.string().optional(),
      offer: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      user: z.string().optional(),
      business: z.string().optional(),
      message: z.string().optional(),
      offer: z.string().optional(),
    }),
  }),
}
