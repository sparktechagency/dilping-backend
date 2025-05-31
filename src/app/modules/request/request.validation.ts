import { z } from 'zod'

export const RequestValidations = {
  create: z.object({
    radius: z.number({ required_error: 'radius is required' }),
    message: z.string({ required_error: 'message is required' }),
    coordinates: z.array(z.number()).length(2, {
      message: 'Coordinates must be an array of two numbers',
    }),
  }),

  update: z.object({
    message: z.string().optional(),
  }),
}
