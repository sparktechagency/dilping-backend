"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chat: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chat' },
    request: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Request' },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    type: { type: String, enum: ['text', 'offer', 'image', 'both'] },
    offerTitle: { type: String },
    status: { type: String, enum: ['new', 'ongoing', 'completed'], default: 'new' },
    offerDescription: { type: String },
    images: { type: [String] },
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
