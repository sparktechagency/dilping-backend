"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatValidations = void 0;
const zod_1 = require("zod");
exports.ChatValidations = {
    create: zod_1.z.object({
        request: zod_1.z.string(),
        latestMessage: zod_1.z.string(),
        latestMessageTime: zod_1.z.string().datetime(),
        isEnabled: zod_1.z.boolean(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    }),
    update: zod_1.z.object({
        _id: zod_1.z.string().optional(),
        request: zod_1.z.string().optional(),
        latestMessage: zod_1.z.string().optional(),
        latestMessageTime: zod_1.z.string().datetime().optional(),
        isEnabled: zod_1.z.boolean().optional(),
        createdAt: zod_1.z.string().datetime().optional(),
        updatedAt: zod_1.z.string().datetime().optional(),
    }),
};
