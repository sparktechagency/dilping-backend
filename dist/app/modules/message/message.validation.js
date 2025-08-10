"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidations = void 0;
const zod_1 = require("zod");
exports.MessageValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            request: zod_1.z.string().optional(),
            message: zod_1.z.string().optional(),
            image: zod_1.z.array(zod_1.z.string()).optional(),
            // offer: z.string().optional(),
            offerTitle: zod_1.z.string().optional(),
            offerDescription: zod_1.z.string().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            message: zod_1.z.string().optional(),
            image: zod_1.z.array(zod_1.z.string()).optional(),
            // offer: z.string().optional(),
            offerTitle: zod_1.z.string().optional(),
            offerDescription: zod_1.z.string().optional(),
        }),
    }),
};
