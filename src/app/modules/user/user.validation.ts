import { z } from 'zod';
import { USER_ROLES } from '../../../enum/user';

const createUserZodSchema = z.object({
    body: z.object({
        email: z.string({required_error: 'Email is required'}).email(),
        password: z.string({required_error: 'Password is required'}).min(6),
        name: z.string({required_error: 'Name is required'}).optional(),
        phone: z.string({required_error: 'Phone is required'}).optional(),
        address: z.string().optional(),
        role: z.enum([USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.GUEST], {
            message: 'Role must be one of admin, user, guest',
        }),
    }),
});

export const UserValidations = { createUserZodSchema };
