"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMessageStatusByRequest = exports.enableChat = exports.sendMessage = exports.getMessageByChat = void 0;
const message_model_1 = require("./message.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const chat_model_1 = require("../chat/chat.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_client_1 = require("../../../helpers/redis.client");
const user_1 = require("../../../enum/user");
const getMessageByChat = async (chatId, requestId, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions || {});
    // Build query - if requestId is provided, filter by it
    const query = { chat: chatId };
    if (requestId) {
        query.request = requestId;
    }
    const [result, total] = await Promise.all([
        message_model_1.Message.find(query).populate({
            path: 'sender',
            select: 'name profile address rating ratingCount email category',
        }).populate({
            path: 'receiver',
            select: 'name profile address rating ratingCount email category',
        }).populate({
            path: 'request',
            select: 'message category coordinates',
        })
            .sort({ createdAt: 'desc' }).skip(skip).limit(limit).lean(),
        message_model_1.Message.countDocuments(query)
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: result
    };
};
exports.getMessageByChat = getMessageByChat;
const sendMessage = async (user, payload) => {
    const sender = user.authId;
    const { chat, message, images, request } = payload;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Check if the requested user is the participant of the chat
        const chatExist = await chat_model_1.Chat.findById(chat).populate({
            path: 'participants',
            select: 'name profile',
        }).lean();
        if (!chatExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Sorry the chat you are trying to access does not exist.');
        }
        // Check if the sender is the participant of the chat
        if (!chatExist.participants.some((participant) => participant._id.toString() === sender)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Sorry you are not authorized to access this chat.');
        }
        if (!chatExist.isMessageEnabled && user.role !== user_1.USER_ROLES.BUSINESS) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Sorry the message is disabled for this chat.');
        }
        // Validate that the request belongs to this chat
        if (request && !chatExist.requests.some((req) => req.toString() === request.toString())) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'The specified request does not belong to this chat.');
        }
        payload.receiver = chatExist.participants.find((participant) => participant._id.toString() !== sender);
        // Decide the type of the message
        const type = payload.offerTitle
            ? 'offer'
            : payload.images && payload.message
                ? 'both'
                : payload.images
                    ? 'image'
                    : 'text';
        // Create the message with request linkage
        const [newMessage] = await message_model_1.Message.create([{
                chat,
                request: request || null,
                sender,
                receiver: payload.receiver,
                message,
                type,
                offerTitle: payload.offerTitle,
                offerDescription: payload.offerDescription,
                images,
                status: 'new', // Default status for new messages
            }], { session });
        const populatedMessage = await newMessage.populate([
            { path: 'sender', select: 'name profile address rating ratingCount' },
            { path: 'receiver', select: 'name profile address rating ratingCount' },
            { path: 'request', select: 'message category' },
        ]);
        //@ts-ignore
        const socket = global.io;
        socket.emit(`message::${chat}`, populatedMessage);
        if (!newMessage) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create message');
        }
        // Update the chat
        await chat_model_1.Chat.findByIdAndUpdate(chat, {
            latestMessage: type === 'offer' ? payload.offerTitle : payload.message,
            latestMessageTime: new Date(),
            isMessageEnabled: type === 'offer' ? false : true,
        }, { session });
        // Clear cache for chat
        const cacheKey = `chat:user:${'new'}-${chatExist.participants[1]._id.toString()}-${1}`;
        const secondCacheKey = `chat:user:${'ongoing'}-${chatExist.participants[1]._id.toString()}-${1}`;
        // Clear cache for all requests in this chat
        const cacheDelPromises = chatExist.requests.map((requestId) => redis_client_1.redisClient.del(`chat:user-${chatExist.participants[0]._id.toString()}:${requestId.toString()}`));
        await Promise.all(cacheDelPromises);
        await redis_client_1.redisClient.del(cacheKey, secondCacheKey);
        await session.commitTransaction();
        return newMessage;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.sendMessage = sendMessage;
const enableChat = async (chatId) => {
    const chat = await chat_model_1.Chat.findByIdAndUpdate(chatId, { isMessageEnabled: true });
    if (!chat) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Failed to enable chat.');
    }
    //del cache for chat
    const cacheKey = `chat:user:${'new'}-${chat.participants[1].toString()}-${1}`;
    const secondCacheKey = `chat:user:${'ongoing'}-${chat.participants[1].toString()}-${1}`;
    const userCacheKey = `chat:user-${chat.participants[0].toString()}:${chat.request.toString()}`;
    await redis_client_1.redisClient.del(cacheKey, secondCacheKey, userCacheKey);
    //@ts-ignore
    const socket = global.io;
    socket.emit(`chatEnabled::${chat.participants[1].toString()}`, chat);
    return "Chat enabled successfully.";
};
exports.enableChat = enableChat;
const updateMessageStatusByRequest = async (requestId, status) => {
    var _a, _b, _c;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Update all messages linked to this request
        const result = await message_model_1.Message.updateMany({ request: requestId }, { status }, { session });
        // Get the chat associated with this request to clear cache
        const chat = await chat_model_1.Chat.findOne({ requests: { $in: [requestId] } }).lean();
        if (chat) {
            // Clear cache for all participants
            const cacheDelPromises = chat.participants.map((participantId) => {
                const userCacheKey = `chat:user-${participantId.toString()}:${requestId}`;
                return redis_client_1.redisClient.del(userCacheKey);
            });
            // Clear business cache keys for different statuses
            const businessCacheKeys = [
                `chat:user:${'new'}-${((_a = chat.participants[1]._id) === null || _a === void 0 ? void 0 : _a.toString()) || chat.participants[1].toString()}-${1}`,
                `chat:user:${'ongoing'}-${((_b = chat.participants[1]._id) === null || _b === void 0 ? void 0 : _b.toString()) || chat.participants[1].toString()}-${1}`,
                `chat:user:${'completed'}-${((_c = chat.participants[1]._id) === null || _c === void 0 ? void 0 : _c.toString()) || chat.participants[1].toString()}-${1}`
            ];
            cacheDelPromises.push(...businessCacheKeys.map(key => redis_client_1.redisClient.del(key)));
            await Promise.all(cacheDelPromises);
        }
        await session.commitTransaction();
        return result;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.updateMessageStatusByRequest = updateMessageStatusByRequest;
