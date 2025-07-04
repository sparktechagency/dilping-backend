"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chat: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chat' },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    type: { type: String, enum: ['text', 'offer', 'image', 'both'] }, // Add the 'type' field with enum value
    offer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Offer' },
}, {
    timestamps: true,
});
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
