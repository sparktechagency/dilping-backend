import { z } from 'zod'

// export const RequestValidations = {
//   create: z.object({
//     radius: z.number({ required_error: 'radius is required' }),
//     message: z.string({ required_error: 'message is required' }),
//     coordinates: z.array(z.number()).length(2, {
//       message: 'Coordinates must be an array of two numbers',
//     }),
//   }),

//   update: z.object({
//     message: z.string().optional(),
//   }),
// }

const requestZodSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'category is required' }),
    subCategory: z.string({ required_error: 'subCategory is required' }),
    radius: z.number({ required_error: 'radius is required' }),
    message: z.string({ required_error: 'message is required' }),
    coordinates: z.array(z.number()).length(2, {
      message: 'Coordinates must be an array of two numbers',
    }),
  }),
})

export const RequestValidations = {
  requestZodSchema,
}
