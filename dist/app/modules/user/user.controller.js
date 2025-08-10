"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_service_1 = require("./user.service");
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const { ...userData } = req.body;
    const user = await user_service_1.UserServices.createUser(userData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'User created successfully',
        data: user,
    });
});
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { image, ...userData } = req.body;
    console.log(image);
    if ((image === null || image === void 0 ? void 0 : image.length) > 0)
        userData.profile = image[0];
    const result = await user_service_1.UserServices.updateProfile(req.user, userData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
const getProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserServices.getProfile(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Profile retrieved successfully',
        data: result,
    });
});
const createRating = (0, catchAsync_1.default)(async (req, res) => {
    const { rating } = req.body;
    const reviewTo = req.params.reviewTo;
    const result = await user_service_1.UserServices.createRating(rating, reviewTo);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Rating created successfully',
        data: result,
    });
});
exports.UserController = {
    createUser,
    updateProfile,
    getProfile,
    createRating,
};
