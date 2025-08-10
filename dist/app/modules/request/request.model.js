"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const mongoose_1 = require("mongoose");
const requestSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategories: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'Subcategory', required: true },
    message: { type: String, required: true },
    businesses: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'User', required: true },
    h3Index: { type: String },
    radius: { type: Number, required: true },
    coordinates: { type: [Number], required: true },
}, {
    timestamps: true,
});
exports.Request = (0, mongoose_1.model)('Request', requestSchema);
