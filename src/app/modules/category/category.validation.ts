import { z } from 'zod'

export const CategoryValidations = {
  create: z.object({
    title: z.string(),
    icon: z.string(),
  }),

  update: z.object({
    title: z.string().optional(),
    icon: z.string().optional(),
  }),
}
