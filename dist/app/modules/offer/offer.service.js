"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const offer_model_1 = require("./offer.model");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_client_1 = require("../../../helpers/redis.client");
const redis_1 = require("../../../enum/redis");
const logger_1 = require("../../../shared/logger");
const createOffer = async (user, payload) => {
    payload.business = user.authId;
    const result = await offer_model_1.Offer.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Offer');
    return result;
};
const getAllOffers = async (user) => {
    const result = await offer_model_1.Offer.find({ business: user.authId })
        .lean()
        .sort({ default: -1 });
    return result;
};
const getSingleOffer = async (id) => {
    const result = await offer_model_1.Offer.findById(id)
        .lean();
    return result;
};
const updateOffer = async (user, id, payload) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        if (payload.default === true) {
            await offer_model_1.Offer.updateMany({
                business: user.authId,
            }, { $set: { default: false } }, { session });
        }
        const result = await offer_model_1.Offer.findOneAndUpdate({
            _id: id,
            business: user.authId,
        }, { $set: { ...payload } }, {
            new: true,
            session,
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested offer not found.');
        }
        // Invalidate Redis cache for this business
        try {
            await redis_client_1.redisClient.del(`${redis_1.REDIS_KEYS.DEFAULT_OFFERS}:${user.authId}`);
            logger_1.logger.info(`Cache invalidated for business: ${user.authId}`);
        }
        catch (cacheError) {
            logger_1.logger.warn('Offer cache invalidation failed', cacheError);
        }
        await session.commitTransaction();
        return 'Offer updated successfully.';
    }
    catch (error) {
        await session.abortTransaction();
        logger_1.logger.error('Offer update failed', error);
        throw error;
    }
    finally {
        await session.endSession();
    }
};
const deleteOffer = async (user, id) => {
    try {
        const result = await offer_model_1.Offer.findOneAndDelete({
            _id: id,
            business: user.authId,
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested offer not found.');
        }
        // Invalidate Redis cache only if deleted offer was default
        if (result.default) {
            try {
                await redis_client_1.redisClient.del(`${redis_1.REDIS_KEYS.DEFAULT_OFFERS}:${user.authId}`);
                logger_1.logger.info(`Cache invalidated for business: ${user.authId}`);
            }
            catch (cacheError) {
                logger_1.logger.warn('Offer cache invalidation failed', cacheError);
            }
        }
        return 'Offer deleted successfully.';
    }
    catch (error) {
        logger_1.logger.error('Offer deletion failed', error);
        throw error;
    }
};
exports.OfferServices = {
    createOffer,
    getAllOffers,
    getSingleOffer,
    updateOffer,
    deleteOffer,
};
