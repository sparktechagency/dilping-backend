"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidations = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        password: zod_1.z.string({ required_error: 'Password is required' }).min(6),
        confirmPassword: zod_1.z.string({
            required_error: 'Confirm password is required',
        }),
        name: zod_1.z.string({ required_error: 'Name is required' }).optional(),
        lastName: zod_1.z.string().optional(),
        businessName: zod_1.z.string().optional(),
        eiin: zod_1.z.string().optional(),
        license: zod_1.z.string().optional(),
        appId: zod_1.z.string().optional(),
        deviceToken: zod_1.z.string().optional(),
        phone: zod_1.z.string({ required_error: 'Phone is required' }).optional(),
        address: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        subCategories: zod_1.z.array(zod_1.z.string()).optional(),
        role: zod_1.z.enum([
            user_1.USER_ROLES.ADMIN,
            user_1.USER_ROLES.USER,
            user_1.USER_ROLES.GUEST,
            user_1.USER_ROLES.BUSINESS,
        ], {
            message: 'Role must be one of admin, user, guest',
        }),
    })
        .refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
const updateUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        image: zod_1.z.array(zod_1.z.string()).optional(),
        businessName: zod_1.z.string().optional(),
        eiin: zod_1.z.string().optional(),
        license: zod_1.z.string().optional(),
        appId: zod_1.z.string().optional(),
        deviceToken: zod_1.z.string().optional(),
        profile: zod_1.z.string().optional(),
        location: zod_1.z.array(zod_1.z.number()).optional(),
        category: zod_1.z.string().optional(),
        subCategories: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const createRatingZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number(),
        reviewTo: zod_1.z.string(),
    }),
});
exports.UserValidations = { createUserZodSchema, updateUserZodSchema, createRatingZodSchema };
