"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryValidations = void 0;
const zod_1 = require("zod");
exports.CategoryValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string(),
            image: zod_1.z.array(zod_1.z.string()),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string().optional(),
            image: zod_1.z.array(zod_1.z.string()).optional(),
        }),
    }),
};
