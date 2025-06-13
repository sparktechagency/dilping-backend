"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const user_model_1 = require("../../../user/user.model");
const passport_local_1 = require("passport-local");
const user_1 = require("../../../../../enum/user");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const config_1 = __importDefault(require("../../../../../config"));
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../../../errors/ApiError"));
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, email, password, done) => {
    try {
        const lowercaseEmail = email.toLowerCase().trim();
        const isUserExist = await user_model_1.User.findOne({
            email: lowercaseEmail,
            status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
        })
            .select('+password +authentication')
            .lean();
        if (!isUserExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No account found with this email, please sign up first.');
        }
        return done(null, {
            ...isUserExist,
        });
    }
    catch (err) {
        return done(err);
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.default.google.client_id,
    clientSecret: config_1.default.google.client_secret,
    callbackURL: config_1.default.google.callback_url,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    req.body.profile = profile;
    req.body.role = user_1.USER_ROLES.BUSINESS;
    try {
        return done(null, req.body);
    }
    catch (err) {
        return done(err);
    }
}));
exports.default = passport_1.default;
