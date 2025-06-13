"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const offer_model_1 = require("./offer.model");
const createOffer = async (user, payload) => {
    payload.business = user.authId;
    const result = await offer_model_1.Offer.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Offer');
    return result;
};
const getAllOffers = async (user) => {
    const result = await offer_model_1.Offer.find({ business: user.authId, status: 'active' })
        .populate('business', 'businessName location address profile zipcode')
        .lean();
    return result;
};
const getSingleOffer = async (id) => {
    const result = await offer_model_1.Offer.findById(id)
        .populate('business', 'businessName profile address zipCode location')
        .lean();
    if ((result === null || result === void 0 ? void 0 : result.status) === 'inactive') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'The requested offer is not available at the moment. Please try again later.');
    }
    return result;
};
const updateOffer = async (user, id, payload) => {
    if (payload.default === true) {
        await offer_model_1.Offer.updateMany({
            business: user.authId,
            status: 'active',
        }, { $set: { default: false } });
    }
    const result = await offer_model_1.Offer.findOneAndUpdate({
        _id: id,
        business: user.authId,
        status: 'active', // Assuming you only want to update active offers
    }, { $set: payload }, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested offer not found.');
    }
    return 'Offer updated successfully.';
};
const deleteOffer = async (user, id) => {
    const result = await offer_model_1.Offer.findOneAndUpdate({
        _id: id,
        business: user.authId,
        status: 'active',
    }, { $set: { status: 'inactive' } }, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'The requested offer not found.');
    }
    return 'Offer deleted successfully.';
};
exports.OfferServices = {
    createOffer,
    getAllOffers,
    getSingleOffer,
    updateOffer,
    deleteOffer,
};
