"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    request: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Request', required: true },
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    latestMessage: { type: String, default: '' },
    latestMessageTime: { type: Date, default: Date.now },
    isEnabled: { type: Boolean, default: false },
    isMessageEnabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
