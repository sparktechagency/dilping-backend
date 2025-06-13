"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAuthServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../../user/user.model");
const auth_helper_1 = require("../auth.helper");
const ApiError_1 = __importDefault(require("../../../../errors/ApiError"));
const user_1 = require("../../../../enum/user");
const config_1 = __importDefault(require("../../../../config"));
const token_model_1 = require("../../token/token.model");
const emailHelper_1 = require("../../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../../shared/emailTemplate");
const crypto_1 = __importStar(require("../../../../utils/crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const common_1 = require("../common");
const jwtHelper_1 = require("../../../../helpers/jwtHelper");
const customLogin = async (payload) => {
    const { email, phone } = payload;
    const query = email ? { email: email.toLowerCase() } : { phone: phone };
    const isUserExist = await user_model_1.User.findOne({
        ...query,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    })
        .select('+password +authentication')
        .lean();
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `No account found with this ${email ? 'email' : 'phone'}`);
    }
    const result = await common_1.AuthCommonServices.handleLoginLogic(payload, isUserExist);
    return result;
};
const forgetPassword = async (email, phone) => {
    const query = email ? { email: email } : { phone: phone };
    const isUserExist = await user_model_1.User.findOne({
        ...query,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with this email or phone');
    }
    const otp = (0, crypto_1.generateOtp)();
    const authentication = {
        oneTimeCode: otp,
        resetPassword: true,
        latestRequestAt: new Date(),
        requestCount: 1,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        authType: 'resetPassword',
    };
    //send otp to user
    if (email) {
        const forgetPasswordEmailTemplate = emailTemplate_1.emailTemplate.resetPassword({
            name: isUserExist.name,
            email: isUserExist.email,
            otp,
        });
        emailHelper_1.emailHelper.sendEmail(forgetPasswordEmailTemplate);
    }
    if (phone) {
        //implement this feature using twilio/aws sns
    }
    await user_model_1.User.findByIdAndUpdate(isUserExist._id, { $set: { authentication } });
    return { message: 'OTP sent successfully' };
};
const resetPassword = async (resetToken, payload) => {
    const { newPassword, confirmPassword } = payload;
    if (newPassword !== confirmPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Passwords do not match');
    }
    const isTokenExist = await token_model_1.Token.findOne({ token: resetToken }).lean();
    if (!isTokenExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You don't have authorization to reset your password");
    }
    const isUserExist = await user_model_1.User.findById(isTokenExist.user)
        .select('+authentication')
        .lean();
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Something went wrong, please try again.');
    }
    const { authentication } = isUserExist;
    if (!(authentication === null || authentication === void 0 ? void 0 : authentication.resetPassword)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don\'t have permission to change the password. Please click again to "Forgot Password"');
    }
    const isTokenValid = (isTokenExist === null || isTokenExist === void 0 ? void 0 : isTokenExist.expireAt) > new Date();
    if (!isTokenValid) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Your reset token has expired, please try again.');
    }
    const hashPassword = await bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updatedUserData = {
        password: hashPassword,
        authentication: {
            resetPassword: false,
        },
    };
    await user_model_1.User.findByIdAndUpdate(isUserExist._id, { $set: updatedUserData }, { new: true });
    return { message: 'Password reset successfully' };
};
const verifyAccount = async (onetimeCode, email, phone) => {
    //verify fo new user
    if (!onetimeCode) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP is required');
    }
    const query = email ? { email: email } : { phone: phone };
    const isUserExist = await user_model_1.User.findOne({
        ...query,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    })
        .select('+authentication')
        .lean();
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No account found with this email or phone');
    }
    const { authentication } = isUserExist;
    if ((authentication === null || authentication === void 0 ? void 0 : authentication.oneTimeCode) !== onetimeCode) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You provided wrong OTP, please try again.');
    }
    const currentDate = new Date();
    if ((authentication === null || authentication === void 0 ? void 0 : authentication.expiresAt) < currentDate) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP has expired, please try again.');
    }
    const returnable = {
        message: '',
        token: '',
    };
    if (!isUserExist.verified) {
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, { $set: { verified: true } }, { new: true });
        returnable.message = 'Account verified successfully';
    }
    else {
        const authentication = {
            oneTimeCode: null,
            resetPassword: true,
        };
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, { $set: { authentication } }, { new: true });
        const token = (0, crypto_1.default)();
        const resetToken = await token_model_1.Token.create({
            user: isUserExist._id,
            token,
            expireAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });
        returnable.token = resetToken.token;
        returnable.message =
            'OTP verified successfully, please reset your password.';
    }
    return returnable;
};
const getRefreshToken = async (token) => {
    try {
        const decodedToken = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_refresh_secret);
        const { userId, role } = decodedToken;
        const tokens = auth_helper_1.AuthHelper.createToken(userId, role);
        return {
            accessToken: tokens.accessToken,
        };
    }
    catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Refresh Token has expired');
        }
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Invalid Refresh Token');
    }
};
const socialLogin = async (appId, deviceToken) => {
    const isUserExist = await user_model_1.User.findOne({
        appId,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    });
    if (!isUserExist) {
        const createdUser = await user_model_1.User.create({
            appId,
            deviceToken,
            status: user_1.USER_STATUS.ACTIVE,
        });
        if (!createdUser)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user.');
        const tokens = auth_helper_1.AuthHelper.createToken(createdUser._id, createdUser.role);
        return tokens.accessToken;
    }
    else {
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: {
                deviceToken,
            },
        });
        const tokens = auth_helper_1.AuthHelper.createToken(isUserExist._id, isUserExist.role);
        //send token to client
        return tokens.accessToken;
    }
};
const resendOtpToPhoneOrEmail = async (type, email, phone) => {
    const query = email ? { email: email } : { phone: phone };
    const isUserExist = await user_model_1.User.findOne({
        ...query,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    }).select('+authentication');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `No account found with this ${email ? 'email' : 'phone'}`);
    }
    //check the request count
    const { authentication } = isUserExist;
    if ((authentication === null || authentication === void 0 ? void 0 : authentication.requestCount) >= 5) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You have exceeded the maximum number of requests. Please try again later.');
    }
    const otp = (0, crypto_1.generateOtp)();
    const updatedAuthentication = {
        oneTimeCode: otp,
        latestRequestAt: new Date(),
        requestCount: (authentication === null || authentication === void 0 ? void 0 : authentication.requestCount) + 1,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
    //send otp to user
    if (email) {
        const forgetPasswordEmailTemplate = emailTemplate_1.emailTemplate.resendOtp({
            email: isUserExist.email,
            name: isUserExist.name,
            otp,
            type,
        });
        emailHelper_1.emailHelper.sendEmail(forgetPasswordEmailTemplate);
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: { authentication: updatedAuthentication },
        }, { new: true });
    }
    if (phone) {
        //implement this feature using twilio/aws sns
        await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
            $set: { authentication: updatedAuthentication },
        }, { new: true });
    }
};
const deleteAccount = async (user, password) => {
    const { authId } = user;
    const isUserExist = await user_model_1.User.findById(authId).select('+password').lean();
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Requested user not found.');
    }
    if (isUserExist.status === user_1.USER_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Requested user is already deleted.');
    }
    const isPasswordMatch = await bcrypt_1.default.compare(password, isUserExist.password);
    if (!isPasswordMatch) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password does not match. Please try again with correct password.');
    }
    const deletedData = await user_model_1.User.findByIdAndUpdate(authId, {
        $set: { status: user_1.USER_STATUS.DELETED },
    });
    return 'Account deleted successfully.';
};
const resendOtp = async (email, phone) => {
    var _a;
    const query = email ? { email: email } : { phone: phone };
    const isUserExist = await user_model_1.User.findOne({
        ...query,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    }).select('+authentication');
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `No account found with this ${email ? 'email' : 'phone'}`);
    }
    const otp = (0, crypto_1.generateOtp)();
    const authentication = {
        oneTimeCode: otp,
        latestRequestAt: new Date(),
        requestCount: ((_a = isUserExist.authentication) === null || _a === void 0 ? void 0 : _a.requestCount) + 1,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
    await user_model_1.User.findByIdAndUpdate(isUserExist._id, {
        $set: { authentication },
    });
    if (isUserExist.authentication.requestCount >= 4) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You have exceeded the maximum number of requests. Please try again later.');
    }
    //send otp to user
    if (email) {
        const forgetPasswordEmailTemplate = emailTemplate_1.emailTemplate.resendOtp({
            email: isUserExist.email,
            name: isUserExist.name,
            otp,
            type: 'verify',
        });
        emailHelper_1.emailHelper.sendEmail(forgetPasswordEmailTemplate);
    }
    return 'OTP sent successfully.';
};
const changePassword = async (user, currentPassword, newPassword) => {
    // Find the user with password field
    const isUserExist = await user_model_1.User.findById(user.authId)
        .select('+password')
        .lean();
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Check if current password matches
    const isPasswordMatch = await auth_helper_1.AuthHelper.isPasswordMatched(currentPassword, isUserExist.password);
    if (!isPasswordMatch) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Current password is incorrect');
    }
    // Hash the new password
    const hashedPassword = await bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    // Update the password
    await user_model_1.User.findByIdAndUpdate(user.authId, { password: hashedPassword }, { new: true });
    return { message: 'Password changed successfully' };
};
exports.CustomAuthServices = {
    forgetPassword,
    resetPassword,
    verifyAccount,
    customLogin,
    getRefreshToken,
    socialLogin,
    resendOtpToPhoneOrEmail,
    deleteAccount,
    resendOtp,
    changePassword,
};
