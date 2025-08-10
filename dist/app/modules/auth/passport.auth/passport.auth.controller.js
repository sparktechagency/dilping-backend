"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportAuthController = void 0;
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const passport_auth_service_1 = require("./passport.auth.service");
const common_1 = require("../common");
const login = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { deviceToken, password } = req.body;
    const result = await common_1.AuthCommonServices.handleLoginLogic({ deviceToken: deviceToken, password: password }, user);
    const { status, message, accessToken, refreshToken, role } = result;
    (0, sendResponse_1.default)(res, {
        statusCode: status,
        success: true,
        message: message,
        data: {
            accessToken,
            refreshToken,
            role,
        },
    });
});
const googleAuthCallback = (0, catchAsync_1.default)(async (req, res) => {
    const result = await passport_auth_service_1.PassportAuthServices.handleGoogleLogin(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Login successful',
        data: result,
    });
});
exports.PassportAuthController = {
    login,
    googleAuthCallback,
};
