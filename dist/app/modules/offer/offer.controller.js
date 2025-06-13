"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferController = void 0;
const offer_service_1 = require("./offer.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createOffer = (0, catchAsync_1.default)(async (req, res) => {
    const offerData = req.body;
    const result = await offer_service_1.OfferServices.createOffer(req.user, offerData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Offer created successfully',
        data: result,
    });
});
const updateOffer = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const offerData = req.body;
    const result = await offer_service_1.OfferServices.updateOffer(req.user, id, offerData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Offer updated successfully',
        data: result,
    });
});
const getSingleOffer = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await offer_service_1.OfferServices.getSingleOffer(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Offer retrieved successfully',
        data: result,
    });
});
const getAllOffers = (0, catchAsync_1.default)(async (req, res) => {
    const result = await offer_service_1.OfferServices.getAllOffers(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Offers retrieved successfully',
        data: result,
    });
});
const deleteOffer = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await offer_service_1.OfferServices.deleteOffer(req.user, id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Offer deleted successfully',
        data: result,
    });
});
exports.OfferController = {
    createOffer,
    updateOffer,
    getSingleOffer,
    getAllOffers,
    deleteOffer,
};
