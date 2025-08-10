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
const crypto_1 = require("../../../utils/crypto");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const bull_mq_producer_1 = require("../../../helpers/bull-mq-producer");
const handleLoginLogic = async (payload, isUserExist) => {
    const { authentication, verified, status } = isUserExist;
    const password = isUserExist.password.trim();
    const { restrictionLeftAt, wrongLoginAttempts } = authentication;
    if (!verified) {
        //send otp to user
        const otp = (0, crypto_1.generateOtp)();
        const otpExpiresIn = new Date(Date.now() + 5 * 60 * 1000);
        const authentication = {
            email: payload.email,
            oneTimeCode: otp,
            expiresAt: otpExpiresIn,
            latestRequestAt: new Date(),
            authType: 'createAccount',
        };
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                authentication,
            },
        });
        const otpEmailTemplate = emailTemplate_1.emailTemplate.createAccount({
            name: isUserExist.name,
            email: isUserExist.email,
            otp,
        });
        //sending email using bullmq
        bull_mq_producer_1.emailQueue.add('emails', otpEmailTemplate);
        return {
            status: http_status_codes_1.StatusCodes.PROXY_AUTHENTICATION_REQUIRED,
            message: 'We have sent an OTP to your email, please verify your email and try again.',
            accessToken: '',
            refreshToken: '',
            role: '',
        };
    }
    if (status === user_1.USER_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with the given email, please try again with valid email or create a new account.');
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
    const tokens = auth_helper_1.AuthHelper.createToken(isUserExist._id, isUserExist.role, isUserExist.name, isUserExist.email, payload.deviceToken);
    return {
        status: http_status_codes_1.StatusCodes.OK,
        message: `Welcome back ${isUserExist.name}`,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: isUserExist.role,
    };
};
exports.AuthCommonServices = {
    handleLoginLogic,
};
