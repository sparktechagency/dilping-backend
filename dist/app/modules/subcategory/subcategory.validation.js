"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoryValidations = void 0;
const zod_1 = require("zod");
exports.SubcategoryValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            category: zod_1.z.string(),
            subCategories: zod_1.z.array(zod_1.z.string()),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            category: zod_1.z.string().optional(),
            subCategories: zod_1.z.array(zod_1.z.string()).optional(),
        }),
    }),
};
