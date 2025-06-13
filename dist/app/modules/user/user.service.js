"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("./user.model");
const user_1 = require("../../../enum/user");
const crypto_1 = require("../../../utils/crypto");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
const logger_1 = require("../../../shared/logger");
const createUser = async (payload) => {
    var _a;
    //check if user already exist
    payload.email = (_a = payload.email) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const isUserExist = await user_model_1.User.findOne({
        email: payload.email,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `An account with this email already exist, please login or try with another email.`);
    }
    if (payload.role === user_1.USER_ROLES.BUSINESS) {
        if (!payload.businessName || !payload.eiin || !payload.license) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Business name, EIIN and license are required.');
        }
    }
    const user = await user_model_1.User.create([payload]);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    const otp = (0, crypto_1.generateOtp)();
    const otpExpiresIn = new Date(Date.now() + 5 * 60 * 1000);
    const authentication = {
        oneTimeCode: otp,
        expiresAt: otpExpiresIn,
        latestRequestAt: new Date(),
        authType: 'createAccount',
    };
    await user_model_1.User.findByIdAndUpdate(user[0]._id, {
        $set: { authentication },
    }, { new: true });
    //send email or sms with otp
    const createAccount = emailTemplate_1.emailTemplate.createAccount({
        name: user[0].name,
        email: user[0].email,
        otp,
    });
    emailHelper_1.emailHelper.sendEmail(createAccount);
    return user[0];
};
const updateProfile = async (user, payload) => {
    if (payload.location) {
        payload.location = {
            type: 'Point',
            coordinates: payload.location,
        };
    }
    const updatedProfile = await user_model_1.User.findOneAndUpdate({ _id: user.authId, status: { $nin: [user_1.USER_STATUS.DELETED] } }, {
        $set: payload,
    }, { new: true });
    if (!updatedProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update profile.');
    }
    return 'Profile updated successfully.';
};
const getProfile = async (user) => {
    const profile = await user_model_1.User.findOne({
        _id: user.authId,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Profile not found.');
    }
    return profile;
};
const createAdmin = async () => {
    const admin = {
        email: 'dealping@gmail.com',
        name: 'Navin',
        password: '12345678',
        role: user_1.USER_ROLES.ADMIN,
        status: user_1.USER_STATUS.ACTIVE,
        verified: true,
        authentication: {
            oneTimeCode: null,
            restrictionLeftAt: null,
            expiresAt: null,
            latestRequestAt: new Date(),
            authType: '',
        },
    };
    const isAdminExist = await user_model_1.User.findOne({
        email: admin.email,
        status: { $nin: [user_1.USER_STATUS.DELETED] },
    });
    if (isAdminExist) {
        logger_1.logger.log('info', 'Admin account already exist, skipping creation.🦥');
        return isAdminExist;
    }
    const result = await user_model_1.User.create([admin]);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create admin');
    }
    return result[0];
};
exports.UserServices = {
    createUser,
    updateProfile,
    getProfile,
    createAdmin,
};
