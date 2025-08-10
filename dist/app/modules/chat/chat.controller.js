"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("./chat.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../../interfaces/pagination");
const pick_1 = __importDefault(require("../../../shared/pick"));
const createChat = (0, catchAsync_1.default)(async (req, res) => {
    const chatData = req.body;
    const result = await chat_service_1.ChatServices.createChat(chatData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Chat created successfully',
        data: result,
    });
});
const updateChat = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const chatData = req.body;
    const result = await chat_service_1.ChatServices.updateChat(id, chatData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat updated successfully',
        data: result,
    });
});
const getSingleChat = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await chat_service_1.ChatServices.getSingleChat(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat retrieved successfully',
        data: result,
    });
});
const getAllChatsForUser = (0, catchAsync_1.default)(async (req, res) => {
    const { requestId } = req.params;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await chat_service_1.ChatServices.getAllChatsForUser(req.user, requestId, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chats retrieved successfully',
        data: result,
    });
});
const getAllChatForBusinesses = (0, catchAsync_1.default)(async (req, res) => {
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const status = req.query.status;
    const result = await chat_service_1.ChatServices.getAllChatForBusinesses(req.user, status, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chats retrieved successfully',
        data: result,
    });
});
const deleteChat = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await chat_service_1.ChatServices.deleteChat(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat deleted successfully',
        data: result,
    });
});
exports.ChatController = {
    createChat,
    updateChat,
    getSingleChat,
    getAllChatsForUser,
    getAllChatForBusinesses,
    deleteChat,
};
