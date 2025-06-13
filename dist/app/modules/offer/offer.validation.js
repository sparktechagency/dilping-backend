"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferValidations = void 0;
const zod_1 = require("zod");
exports.OfferValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            discount: zod_1.z.number(),
            // status: z.enum(['active', 'inactive']), // Assuming 'active' and 'inactive' are the valid statuses for an offer
            // default: z.boolean(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            discount: zod_1.z.number().optional(),
            status: zod_1.z.enum(['active', 'inactive']).optional(), // Assuming 'active' and 'inactive' are the valid statuses for an offer
            default: zod_1.z.boolean().optional(),
        }),
    }),
};
