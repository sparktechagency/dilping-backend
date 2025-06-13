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
    if ((image === null || image === void 0 ? void 0 : image.length) > 0)
        userData.image = image[0].location;
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
exports.UserController = {
    createUser,
    updateProfile,
    getProfile,
};
