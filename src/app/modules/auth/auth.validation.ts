import { z } from "zod";

const verifyEmailOrPhoneOtpZodSchema = z.object({
    body: z.object({
        email: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\S+@\S+\.\S+$/.test(value),
                { message: 'Invalid email format' }
            ),
        phone: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value),
                { message: 'Invalid phone number format' }
            ),
        oneTimeCode: z.string().min(1, { message: 'OTP is required' }),
    }),
})


const forgetPasswordZodSchema = z.object({
    body: z.object({
        email: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\S+@\S+\.\S+$/.test(value),
                { message: 'Invalid email format' }
            ),
        phone: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value),
                { message: 'Invalid phone number format' }
            ),
    }),
})

const resetPasswordZodSchema = z.object({
    body: z.object({
        email: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\S+@\S+\.\S+$/.test(value),
                { message: 'Invalid email format' }
            ),
        phone: z
            .string()
            .optional()
            .refine(
                (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value),
                { message: 'Invalid phone number format' }
            ),
        newPassword: z.string().min(8, { message: 'Password is required' }),
        confirmPassword: z.string().min(8, { message: 'Confirm Password is required' }),
    }),
})

export const AuthValidations = { verifyEmailOrPhoneOtpZodSchema, forgetPasswordZodSchema, resetPasswordZodSchema }