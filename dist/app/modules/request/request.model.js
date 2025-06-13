"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const mongoose_1 = require("mongoose");
const requestSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    h3Index: { type: String },
    radius: { type: Number },
    coordinates: { type: [Number] },
}, {
    timestamps: true,
});
exports.Request = (0, mongoose_1.model)('Request', requestSchema);
