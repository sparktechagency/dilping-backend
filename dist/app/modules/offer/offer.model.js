"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offer = void 0;
const mongoose_1 = require("mongoose");
const offerSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    // discount: { type: Number, required: true },
    default: { type: Boolean, required: true, default: false },
}, {
    timestamps: true,
});
exports.Offer = (0, mongoose_1.model)('Offer', offerSchema);
