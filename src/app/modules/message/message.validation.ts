import { z } from 'zod'

export const MessageValidations = {
  create: z.object({
    body: z.object({
      chat: z.string(),
      receiver: z.string(),
      message: z.string().optional(),
      type: z.string().optional(),
      offer: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      chat: z.string().optional(),
      receiver: z.string().optional(),
      message: z.string().optional(),
      type: z.string().optional(),
      offer: z.string().optional(),
    }),
  }),
}
