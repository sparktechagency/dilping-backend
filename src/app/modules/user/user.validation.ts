import { z } from 'zod'
import { USER_ROLES } from '../../../enum/user'
import { profile } from 'console'

const createUserZodSchema = z.object({
  body: z
    .object({
      email: z.string({ required_error: 'Email is required' }).email(),
      password: z.string({ required_error: 'Password is required' }).min(6),
      confirmPassword: z.string({
        required_error: 'Confirm password is required',
      }),
      name: z.string({ required_error: 'Name is required' }).optional(),
      lastName: z.string().optional(),
      businessName: z.string().optional(),
      eiin: z.string().optional(),
      license: z.string().optional(),
      appId: z.string().optional(),
      deviceToken: z.string().optional(),
      phone: z.string({ required_error: 'Phone is required' }).optional(),
      address: z.string().optional(),
      role: z.enum(
        [
          USER_ROLES.ADMIN,
          USER_ROLES.USER,
          USER_ROLES.GUEST,
          USER_ROLES.BUSINESS,
        ],
        {
          message: 'Role must be one of admin, user, guest',
        },
      ),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
})

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    image: z.array(z.string()).optional(),
    businessName: z.string().optional(),
    eiin: z.string().optional(),
    appId: z.string().optional(),
    deviceToken: z.string().optional(),
    license: z.string().optional(),
    profile: z.string().optional(),
    location: z.array(z.number()).optional(),
  }),
})

export const UserValidations = { createUserZodSchema, updateUserZodSchema }
