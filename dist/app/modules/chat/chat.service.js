"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const chat_model_1 = require("./chat.model");
const message_model_1 = require("../message/message.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const redis_client_1 = require("../../../helpers/redis.client");
const createChat = async (payload) => {
    const result = await chat_model_1.Chat.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Chat');
    return result;
};
const getAllChatsForUser = async (user, requestId, paginationOptions) => {
    const userId = user.authId;
    const { sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const cacheKey = `chat:user-${userId}:${requestId}`;
    const cachedData = await redis_client_1.redisClient.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    // Find chats that contain the specific request
    const [result, total] = await Promise.all([
        chat_model_1.Chat.find({
            participants: { $in: [userId] },
            requests: { $in: [requestId] },
        }).populate({
            path: 'participants',
            select: 'name profile businessName'
        }).sort({ [sortBy]: sortOrder }).lean(),
        chat_model_1.Chat.countDocuments({
            participants: { $in: [userId] },
            requests: { $in: [requestId] },
        })
    ]);
    // Mark messages related to this request as read
    await message_model_1.Message.updateMany({
        chat: { $in: result.map((chat) => chat._id) },
        request: requestId,
        isRead: false,
        receiver: userId,
    }, { isRead: true });
    const formattedResultPromise = result.map(async (chat) => {
        const { participants, ...rest } = chat;
        return {
            ...rest,
            participant: participants.find((participant) => participant._id != userId),
            unreadMessageCount: await message_model_1.Message.countDocuments({
                chat: chat._id,
                request: requestId,
                isRead: false,
                receiver: userId,
            }),
            // Get latest message for this specific request
            latestRequestMessage: await message_model_1.Message.findOne({
                chat: chat._id,
                request: requestId
            }).sort({ createdAt: -1 }).select('message createdAt type')
        };
    });
    const formattedResult = await Promise.all(formattedResultPromise);
    await redis_client_1.redisClient.set(cacheKey, JSON.stringify(formattedResult), 'EX', 60 * 15);
    return formattedResult;
};
const getAllChatForBusinesses = async (user, status, paginationOptions) => {
    const userId = user.authId;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const cacheKey = `chat:user:${status}-${userId}-${page}`;
    const cachedData = await redis_client_1.redisClient.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    // Find chats that have messages with the specified status
    const chatsWithStatus = await message_model_1.Message.distinct('chat', {
        status: status,
        receiver: userId
    });
    const [result, total] = await Promise.all([
        chat_model_1.Chat.find({
            _id: { $in: chatsWithStatus },
            participants: { $in: [userId] },
        }).populate({
            path: 'participants',
            select: 'name profile businessName'
        }).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
        chat_model_1.Chat.countDocuments({
            _id: { $in: chatsWithStatus },
            participants: { $in: [userId] },
        })
    ]);
    await message_model_1.Message.updateMany({
        chat: { $in: result.map((chat) => chat._id) },
        isRead: false,
        receiver: userId,
    }, { isRead: true });
    const formattedResultPromise = result.map(async (chat) => {
        const { participants, ...rest } = chat;
        // Get the latest message with the specified status for this chat
        const latestStatusMessage = await message_model_1.Message.findOne({
            chat: chat._id,
            status: status
        }).sort({ createdAt: -1 }).select('message createdAt type request');
        return {
            ...rest,
            participant: participants.find((participant) => participant._id != userId),
            unreadMessageCount: await message_model_1.Message.countDocuments({
                chat: chat._id,
                isRead: false,
                receiver: userId,
            }),
            latestStatusMessage,
            // Count of messages with this status in the chat
            statusMessageCount: await message_model_1.Message.countDocuments({
                chat: chat._id,
                status: status
            })
        };
    });
    const formattedResult = await Promise.all(formattedResultPromise);
    if (formattedResult.length > 0) {
        await redis_client_1.redisClient.set(cacheKey, JSON.stringify({
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            data: formattedResult
        }), 'EX', 60 * 15);
    }
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: formattedResult
    };
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
    getAllChatForBusinesses,
    getSingleChat,
    updateChat,
    deleteChat,
};
