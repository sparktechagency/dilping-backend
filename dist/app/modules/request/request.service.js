"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const request_utils_1 = require("./request.utils");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model"); // Updated User model with H3
const logger_1 = require("../../../shared/logger");
const offer_model_1 = require("../offer/offer.model");
const request_model_1 = require("./request.model");
const chat_model_1 = require("../chat/chat.model");
const message_model_1 = require("../message/message.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enum/user");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const request_constants_1 = require("./request.constants");
const redis_1 = require("../../../enum/redis");
const redis_client_1 = require("../../../helpers/redis.client");
const createRequest = async (user, data) => {
    const userId = user.authId;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1. User existence check with session consistency
        const userExist = await user_model_1.User.findById(userId).session(session).lean();
        if (!userExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
        }
        if (userExist.status !== user_1.USER_STATUS.ACTIVE) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to create a request");
        }
        // 2. Get businesses within radius (corrected function name typo)
        const businesses = await request_utils_1.RequestUtils.getBusinessesWithinRadius(data.radius, data.coordinates[1], // longitude
        data.coordinates[0], // latitude
        session, data.category, data.subCategories);
        const businessIds = businesses.map((business) => business._id);
        const redisKeys = businessIds.map((id) => `${redis_1.REDIS_KEYS.DEFAULT_OFFERS}:${id}`);
        if (businessIds.length === 0) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Sorry we could not find any businesses in your desired location.');
        }
        // 3. Cache retrieval and processing
        const offersInCache = await redis_client_1.redisClient.mget(redisKeys);
        const offerMap = new Map();
        const offersToCache = [];
        // Process cached and non-cached offers
        offersInCache.forEach((cached, index) => {
            if (cached) {
                try {
                    const parsedOffer = JSON.parse(cached);
                    offerMap.set(businessIds[index].toString(), parsedOffer);
                }
                catch (parseError) {
                    // Treat parse failure as cache miss
                    offersToCache.push(businessIds[index]);
                }
            }
            else {
                offersToCache.push(businessIds[index]);
            }
        });
        // 4. Fetch and cache missing offers
        if (offersToCache.length > 0) {
            const offers = await offer_model_1.Offer.find({
                business: { $in: offersToCache },
                status: 'active',
                default: true,
            }).session(session);
            const redisPipeline = redis_client_1.redisClient.multi();
            for (const offer of offers) {
                const offerData = {
                    _id: offer._id,
                    title: offer.title,
                    description: offer.description,
                };
                offerMap.set(offer.business.toString(), offerData);
                redisPipeline.set(`${redis_1.REDIS_KEYS.DEFAULT_OFFERS}:${offer.business}`, JSON.stringify(offerData));
            }
            try {
                await redisPipeline.exec();
            }
            catch (redisError) {
                logger_1.logger.warn('Redis cache update failed', redisError);
                // Non-critical failure, proceed without caching
            }
        }
        // 5. Create request and process business chats
        const request = await createRequestDocument(user.authId, data, businessIds, session);
        await processBusinessChats(user, businessIds, request, offerMap, businesses, session);
        //invalidate cache
        await redis_client_1.redisClient.del(`requests:${user.authId}:${JSON.stringify(data.category)}:${JSON.stringify(1)}`);
        // 6. Commit transaction
        await session.commitTransaction();
        return request;
    }
    catch (error) {
        await session.abortTransaction();
        logger_1.logger.error('Request creation failed', error);
        // Convert to standardized error if needed
        if (!(error instanceof ApiError_1.default)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Request creation failed');
        }
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const createRequestDocument = async (userId, data, businessIds, session) => {
    const [request] = await request_model_1.Request.create([
        {
            user: userId,
            message: data.message,
            coordinates: data.coordinates,
            radius: data.radius,
            h3Index: null,
            businesses: businessIds,
            category: data.category,
            subCategories: data.subCategories,
        },
    ], { session });
    return request;
};
const processBusinessChats = async (user, businessIds, request, offerMap, businesses, session) => {
    var _a;
    const userId = new mongoose_1.default.Types.ObjectId(user.authId);
    const chatDocs = [];
    const messageDocs = [];
    const chatsToUpdate = [];
    // Step 1: Check for existing chats and prepare new ones
    for (const business of businesses) {
        const businessIdStr = business._id.toString();
        const hasOffer = offerMap.has(businessIdStr);
        // Invalidate chat cache for pagination
        await redis_client_1.redisClient.del(`chat:user:new-${businessIdStr}-1`, `chat:user:ongoing-${businessIdStr}-1`, `chat:user-${userId.toString()}:${request.category.toString()}`, `chat:business-${businessIdStr}:${request.category.toString()}`);
        // Check if chat already exists between user and business
        const existingChat = await chat_model_1.Chat.findOne({
            participants: { $all: [userId, business._id] }
        }).session(session);
        if (existingChat) {
            // Update existing chat to include new request
            chatsToUpdate.push({
                chatId: existingChat._id,
                businessId: business._id,
                hasOffer
            });
        }
        else {
            // Create new chat document
            chatDocs.push({
                requests: [request._id],
                participants: [userId, business._id],
                latestMessage: request.message,
                latestMessageTime: new Date(),
                isEnabled: hasOffer,
                isMessageEnabled: hasOffer ? false : true,
                distance: (0, request_constants_1.calculateDistance)(request.coordinates, business.location.coordinates),
                isDeleted: false,
            });
        }
    }
    // Step 2: Update existing chats with new request
    const updatedChats = [];
    for (const chatUpdate of chatsToUpdate) {
        const updatedChat = await chat_model_1.Chat.findByIdAndUpdate(chatUpdate.chatId, {
            $addToSet: { requests: request._id },
            latestMessage: request.message,
            latestMessageTime: new Date()
        }, { new: true, session });
        if (updatedChat) {
            updatedChats.push(updatedChat);
        }
    }
    // Step 3: Insert new chats
    const newChats = chatDocs.length > 0 ? await chat_model_1.Chat.insertMany(chatDocs, { session }) : [];
    const allChats = [...updatedChats, ...newChats];
    // Step 4: Create messages for each chat
    for (const chat of allChats) {
        const businessIdStr = (_a = chat.participants.find(id => id.toString() !== userId.toString())) === null || _a === void 0 ? void 0 : _a.toString();
        const hasOffer = businessIdStr ? offerMap.has(businessIdStr) : false;
        const offer = businessIdStr ? offerMap.get(businessIdStr) : null;
        // Message 1: User → Business (request message) - linked to specific request
        messageDocs.push({
            chat: chat._id,
            request: request._id,
            sender: userId,
            receiver: chat.participants.find(id => id.toString() !== userId.toString()),
            message: request.message,
            type: 'text',
            status: 'new',
        });
        // Message 2 (Optional): Business → User (offer message) - linked to specific request
        if (hasOffer && offer) {
            messageDocs.push({
                chat: chat._id,
                request: request._id,
                sender: chat.participants.find(id => id.toString() !== userId.toString()),
                receiver: userId,
                message: offer.title,
                offerTitle: offer.title,
                offerDescription: offer.description,
                type: 'offer',
                status: 'new',
            });
        }
    }
    // Step 5: Insert all messages
    if (messageDocs.length > 0) {
        await message_model_1.Message.insertMany(messageDocs, { session });
    }
    // Step 6: Send notifications to businesses
    request_utils_1.RequestUtils.sendRequestNotificationsToBusinessesWithData(user, request, allChats);
    return allChats;
};
const getAllRequests = async (user, filters, paginationOptions) => {
    const { searchTerm } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const andCondition = [];
    const cacheKey = `requests:${user.authId}:${JSON.stringify(filters.category)}:${JSON.stringify(page)}`;
    if (!searchTerm) {
        const cachedData = await redis_client_1.redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    }
    if (searchTerm) {
        request_constants_1.searchableFields.forEach(field => {
            andCondition.push({
                [field]: { $regex: searchTerm, $options: 'i' },
            });
        });
    }
    if (Object.keys(filters).length) {
        request_constants_1.filterableFields.forEach(field => {
            if (filters[field]) {
                andCondition.push({
                    [field]: filters[field],
                });
            }
        });
    }
    andCondition.push({ user: user.authId });
    const whereCondition = andCondition.length > 0 ? { $and: andCondition } : { user: user.authId };
    const requests = await request_model_1.Request.find({
        ...whereCondition,
    }).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean();
    const total = await request_model_1.Request.countDocuments(whereCondition);
    if (requests.length > 0) {
        await redis_client_1.redisClient.set(cacheKey, JSON.stringify({
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            data: requests
        }), 'EX', 60 * 10);
    }
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: requests
    };
};
exports.RequestService = {
    createRequest,
    getAllRequests,
};
