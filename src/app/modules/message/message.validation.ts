import { z } from 'zod'

export const MessageValidations = {
  create: z.object({
    body: z.object({
      request: z.string({ required_error: 'Request id is required' }),
      message: z.string().optional(),
      image: z.array(z.string()).optional(),
      // offer: z.string().optional(),
      offerTitle: z.string().optional(),
      offerDescription: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
     
      message: z.string().optional(),
      image: z.array(z.string()).optional(),
      // offer: z.string().optional(),
      offerTitle: z.string().optional(),
      offerDescription: z.string().optional(),
    }),
  }),
}
