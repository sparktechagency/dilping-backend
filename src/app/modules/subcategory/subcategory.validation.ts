import { z } from 'zod'

export const SubcategoryValidations = {
  create: z.object({
    body: z.object({
      category: z.string(),
      subCategories: z.array(z.string()),
    }),
  }),

  update: z.object({
    body: z.object({
      category: z.string().optional(),
      subCategories: z.array(z.string()).optional(),
    }),
  }),
}
