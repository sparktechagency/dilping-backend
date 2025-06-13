"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCommonServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_1 = require("../../../enum/user");
const user_model_1 = require("../user/user.model");
const auth_helper_1 = require("./auth.helper");
const handleLoginLogic = async (payload, isUserExist) => {
    const { authentication, verified, status } = isUserExist;
    const password = isUserExist.password.trim();
    const { restrictionLeftAt, wrongLoginAttempts } = authentication;
    console.log(verified, status, restrictionLeftAt, wrongLoginAttempts);
    if (!verified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Your email is not verified, please verify your email and try again.');
    }
    if (status === user_1.USER_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with this email');
    }
    if (status === user_1.USER_STATUS.RESTRICTED) {
        if (restrictionLeftAt && new Date() < restrictionLeftAt) {
            const remainingMinutes = Math.ceil((restrictionLeftAt.getTime() - Date.now()) / 60000);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS, `You are restricted to login for ${remainingMinutes} minutes`);
        }
        // Handle restriction expiration
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                authentication: { restrictionLeftAt: null, wrongLoginAttempts: 0 },
                status: user_1.USER_STATUS.ACTIVE,
            },
        });
    }
    const isPasswordMatched = await user_model_1.User.isPasswordMatched(payload.password, password);
    if (!isPasswordMatched) {
        isUserExist.authentication.wrongLoginAttempts = wrongLoginAttempts + 1;
        if (isUserExist.authentication.wrongLoginAttempts >= 5) {
            isUserExist.status = user_1.USER_STATUS.RESTRICTED;
            isUserExist.authentication.restrictionLeftAt = new Date(Date.now() + 10 * 60 * 1000); // restriction for 10 minutes
        }
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                status: isUserExist.status,
                authentication: {
                    restrictionLeftAt: isUserExist.authentication.restrictionLeftAt,
                    wrongLoginAttempts: isUserExist.authentication.wrongLoginAttempts,
                },
            },
        });
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Incorrect password, please try again.');
    }
    await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
        $set: {
            deviceToken: payload.deviceToken,
            authentication: {
                restrictionLeftAt: null,
                wrongLoginAttempts: 0,
            },
        },
    }, { new: true });
    const tokens = auth_helper_1.AuthHelper.createToken(isUserExist._id, isUserExist.role);
    return { ...tokens, role: isUserExist.role };
};
exports.AuthCommonServices = {
    handleLoginLogic,
};
