"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestValidations = void 0;
const zod_1 = require("zod");
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
const requestZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string({ required_error: 'category is required' }),
        subCategories: zod_1.z.array(zod_1.z.string()),
        radius: zod_1.z.number({ required_error: 'radius is required' }),
        message: zod_1.z.string({ required_error: 'message is required' }),
        coordinates: zod_1.z.array(zod_1.z.number()).length(2, {
            message: 'Coordinates must be an array of two numbers',
        }),
    }),
});
exports.RequestValidations = {
    requestZodSchema,
};
