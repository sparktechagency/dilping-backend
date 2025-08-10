"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportAuthServices = void 0;
const user_1 = require("../../../../enum/user");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../../errors/ApiError"));
const user_model_1 = require("../../user/user.model");
const auth_helper_1 = require("../auth.helper");
const handleGoogleLogin = async (payload) => {
    const { emails, photos, displayName, id } = payload.profile;
    const email = emails[0].value.toLowerCase();
    const isUserExist = await user_model_1.User.findOne({
        email,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    });
    if (isUserExist) {
        //return only the token
        const tokens = auth_helper_1.AuthHelper.createToken(isUserExist._id, isUserExist.role, isUserExist.name ? isUserExist.name : "", isUserExist.email ? isUserExist.email : "");
        return {
            status: http_status_codes_1.StatusCodes.OK,
            message: `Welcome back ${isUserExist.name ? isUserExist.name : ""}`,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            role: isUserExist.role,
        };
    }
    const session = await user_model_1.User.startSession();
    session.startTransaction();
    const userData = {
        email: emails[0].value,
        profile: photos[0].value,
        name: displayName,
        verified: true,
        password: id,
        status: user_1.USER_STATUS.ACTIVE,
        appId: id,
        role: payload.role,
    };
    try {
        const user = await user_model_1.User.create([userData], { session });
        if (!user) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
        }
        //create token
        const tokens = auth_helper_1.AuthHelper.createToken(user[0]._id, user[0].role, user[0].name ? user[0].name : "", user[0].email ? user[0].email : "");
        await session.commitTransaction();
        await session.endSession();
        return {
            status: http_status_codes_1.StatusCodes.OK,
            message: `Welcome back ${user[0].name ? user[0].name : ""}`,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            role: user[0].role,
        };
    }
    catch (error) {
        await session.abortTransaction(session);
        session.endSession();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.PassportAuthServices = {
    handleGoogleLogin,
};
