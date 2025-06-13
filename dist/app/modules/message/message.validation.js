"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidations = void 0;
const zod_1 = require("zod");
exports.MessageValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            user: zod_1.z.string(),
            business: zod_1.z.string(),
            message: zod_1.z.string().optional(),
            offer: zod_1.z.string().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            user: zod_1.z.string().optional(),
            business: zod_1.z.string().optional(),
            message: zod_1.z.string().optional(),
            offer: zod_1.z.string().optional(),
        }),
    }),
};
