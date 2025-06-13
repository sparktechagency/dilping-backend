"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const chat_model_1 = require("./chat.model");
const createChat = async (payload) => {
    const result = await chat_model_1.Chat.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Chat');
    return result;
};
const getAllChatsForUser = async (user, requestId) => {
    const userId = user.authId;
    const result = await chat_model_1.Chat.find({
        participants: { $in: [userId] },
        request: requestId,
    }).lean();
    return result;
};
const getSingleChat = async (id) => {
    const result = await chat_model_1.Chat.findById(id);
    return result;
};
const updateChat = async (id, payload) => {
    const result = await chat_model_1.Chat.findByIdAndUpdate(id, { $set: payload }, {
        new: true,
    });
    return result;
};
const deleteChat = async (id) => {
    const result = await chat_model_1.Chat.findByIdAndDelete(id);
    return result;
};
exports.ChatServices = {
    createChat,
    getAllChatsForUser,
    getSingleChat,
    updateChat,
    deleteChat,
};
