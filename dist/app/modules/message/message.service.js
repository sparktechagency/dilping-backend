"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const message_model_1 = require("./message.model");
const createMessage = async (payload) => {
    const result = await message_model_1.Message.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Message');
    return result;
};
const getAllMessages = async () => {
    const result = await message_model_1.Message.find();
    return result;
};
const getSingleMessage = async (id) => {
    const result = await message_model_1.Message.findById(id);
    return result;
};
const updateMessage = async (id, payload) => {
    const result = await message_model_1.Message.findByIdAndUpdate(id, { $set: payload }, {
        new: true,
    });
    return result;
};
const deleteMessage = async (id) => {
    const result = await message_model_1.Message.findByIdAndDelete(id);
    return result;
};
exports.MessageServices = {
    createMessage,
    getAllMessages,
    getSingleMessage,
    updateMessage,
    deleteMessage,
};
