"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subcategory = void 0;
const mongoose_1 = require("mongoose");
const subcategorySchema = new mongoose_1.Schema({
    title: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
});
exports.Subcategory = (0, mongoose_1.model)('Subcategory', subcategorySchema);
