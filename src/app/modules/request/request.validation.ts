import { z } from 'zod'

export const RequestValidations = {
  create: z.object({
    body: z.object({
      radius: z.number({ required_error: 'radius is required' }),
      message: z.string({ required_error: 'message is required' }),
    }),
  }),

  update: z.object({
    body: z.object({
      message: z.string().optional(),
    }),
  }),
}
