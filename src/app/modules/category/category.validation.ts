import { z } from 'zod'

export const CategoryValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      image: z.array(z.string()),
    }),
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      image: z.array(z.string()).optional(),
    }),
  }),
}
