"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
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
const request_utils_1 = require("./request.utils");
const createRequest = async (user, data) => {
    const userId = user.authId;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1. User existence check with cache
        const userExist = await user_model_1.User.findById(userId).session(session).lean();
        if (!userExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
        }
        if (userExist.status !== user_1.USER_STATUS.ACTIVE) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to create a request");
        }
        // const resolution = getResolutionByRadius(data.radius)
        // const centerIndex = latLngToCell(
        //   data.coordinates[1],
        //   data.coordinates[0],
        //   resolution,
        // )
        // const h3Indexes = gridDisk(centerIndex, data.radius)
        // const compacted = compactCells(h3Indexes)
        // console.log(compacted, 'compacted')
        // console.log(h3Indexes, 'h3Indexes')
        //2. Get all the businesses in the radius
        const businesses = await request_utils_1.RequestUtils.getBusinessesWithingRadius(data.radius, data.coordinates[1], data.coordinates[0], session);
        const businessIds = businesses.map((business) => business._id);
        //3. Get all the offers available for businesses
        const offers = await offer_model_1.Offer.find({
            business: {
                $in: businessIds,
            },
            status: 'active',
            default: true,
        }).session(session);
        const offerMap = new Map(offers.map(offer => [
            offer.business.toString(),
            { offerID: offer._id, offerTitle: offer.title },
        ]));
        const request = await createRequestDocument(userId, data, session);
        await processBusinessChats(userId, businessIds, request, offerMap, session);
        //6. Return the request
        await session.commitTransaction();
        return request;
    }
    catch (error) {
        await session.abortTransaction();
        logger_1.logger.error('Request creation failed', error);
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const createRequestDocument = async (userId, data, session) => {
    const [request] = await request_model_1.Request.create([
        {
            user: userId,
            message: data.message,
            coordinates: data.coordinates,
            radius: data.radius,
            h3Index: null,
        },
    ], { session });
    return request;
};
const processBusinessChats = async (userId, businessIds, request, offerMap, session) => {
    const chatDocs = businessIds.map(businessId => {
        var _a;
        return ({
            request: request._id,
            participants: [new mongoose_1.default.Types.ObjectId(userId), businessId],
            latestMessage: ((_a = offerMap.get(businessId.toString())) === null || _a === void 0 ? void 0 : _a.offerTitle) || '',
            isEnabled: offerMap.has(businessId.toString()),
        });
    });
    const chats = await chat_model_1.Chat.insertMany(chatDocs, { session });
    const messageDocs = chats
        .filter(chat => chat.isEnabled)
        .map(chat => {
        var _a, _b;
        return ({
            chat: chat._id,
            sender: new mongoose_1.default.Types.ObjectId(userId),
            message: ((_a = offerMap.get(chat.participants[1].toString())) === null || _a === void 0 ? void 0 : _a.offerTitle) || '',
            offer: (_b = offerMap.get(chat.participants[1].toString())) === null || _b === void 0 ? void 0 : _b.offerID,
        });
    });
    if (messageDocs.length > 0) {
        const messages = await message_model_1.Message.insertMany(messageDocs, { session });
    }
};
const getAllRequests = async (user) => {
    const userId = user.authId;
    const requests = await request_model_1.Request.find({
        user: userId,
    }).lean();
    return requests;
};
exports.RequestService = {
    createRequest,
    getAllRequests,
};
