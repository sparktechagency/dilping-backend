"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const message_service_1 = require("./message.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createMessage = (0, catchAsync_1.default)(async (req, res) => {
    const messageData = req.body;
    const result = await message_service_1.MessageServices.createMessage(messageData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Message created successfully',
        data: result,
    });
});
const updateMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const messageData = req.body;
    const result = await message_service_1.MessageServices.updateMessage(id, messageData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message updated successfully',
        data: result,
    });
});
const getSingleMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await message_service_1.MessageServices.getSingleMessage(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message retrieved successfully',
        data: result,
    });
});
const getAllMessages = (0, catchAsync_1.default)(async (req, res) => {
    const result = await message_service_1.MessageServices.getAllMessages();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Messages retrieved successfully',
        data: result,
    });
});
const deleteMessage = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await message_service_1.MessageServices.deleteMessage(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message deleted successfully',
        data: result,
    });
});
exports.MessageController = {
    createMessage,
    updateMessage,
    getSingleMessage,
    getAllMessages,
    deleteMessage,
};
