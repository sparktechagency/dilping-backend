"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAuthController = void 0;
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const custom_auth_service_1 = require("./custom.auth.service");
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const customLogin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...loginData } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.customLogin(loginData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User logged in successfully',
        data: result,
    });
});
const forgetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const { email, phone } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.forgetPassword(email, phone);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `An OTP has been sent to your ${email || phone}. Please verify your email.`,
        data: result,
    });
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.headers.authorization;
    const { ...resetData } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.resetPassword(token, resetData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Password reset successfully, please login now.',
        data: result,
    });
});
const verifyAccount = (0, catchAsync_1.default)(async (req, res) => {
    const { oneTimeCode, phone, email } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.verifyAccount(oneTimeCode, email, phone);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Account verified successfully, please login now.',
        data: result,
    });
});
const getRefreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.getRefreshToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Token refreshed successfully',
        data: result,
    });
});
const resendOtp = (0, catchAsync_1.default)(async (req, res) => {
    const { email, phone } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.resendOtp(email, phone);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: `An OTP has been sent to your ${email || phone}. Please verify your email.`,
    });
});
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await custom_auth_service_1.CustomAuthServices.changePassword(req.user, currentPassword, newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
    });
});
const deleteAccount = (0, catchAsync_1.default)(async (req, res) => {
    const { password } = req.body; // user password to confirm user inf
    const result = await custom_auth_service_1.CustomAuthServices.deleteAccount(req.user, password);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Account deleted successfully',
        data: result,
    });
});
exports.CustomAuthController = {
    forgetPassword,
    resetPassword,
    verifyAccount,
    customLogin,
    getRefreshToken,
    resendOtp,
    changePassword,
    deleteAccount,
};
