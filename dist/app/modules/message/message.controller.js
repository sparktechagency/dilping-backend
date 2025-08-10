"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../../interfaces/pagination");
const pick_1 = __importDefault(require("../../../shared/pick"));
const message_service_1 = require("./message.service");
const getMessageByChat = (0, catchAsync_1.default)(async (req, res) => {
    const { chatId } = req.params;
    const { requestId } = req.query;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await message_service_1.MessageServices.getMessageByChat(chatId, requestId, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Messages retrieved successfully',
        data: result,
    });
});
const sendMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { chatId } = req.params;
    const { image, ...chatData } = req.body;
    if ((image === null || image === void 0 ? void 0 : image.length) > 0)
        chatData.images = image;
    chatData.chat = chatId;
    const result = await message_service_1.MessageServices.sendMessage(req.user, chatData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message sent successfully',
        data: result,
    });
});
const enableChat = (0, catchAsync_1.default)(async (req, res) => {
    const { chatId } = req.params;
    const result = await message_service_1.MessageServices.enableChat(chatId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat enabled successfully',
        data: result,
    });
});
exports.MessageController = {
    getMessageByChat,
    sendMessage,
    enableChat,
};
