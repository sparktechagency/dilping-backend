"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    title: { type: String },
    icon: { type: String },
    subCategories: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'Subcategory' },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
});
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
