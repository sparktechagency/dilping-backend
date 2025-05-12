import { z } from 'zod'

export const ChatValidations = {
  create: z.object({
    request: z.string(),
    latestMessage: z.string(),
    latestMessageTime: z.string().datetime(),
    isEnabled: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  update: z.object({
    _id: z.string().optional(),
    request: z.string().optional(),
    latestMessage: z.string().optional(),
    latestMessageTime: z.string().datetime().optional(),
    isEnabled: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
}
