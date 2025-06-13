"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../config"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const auth = (...roles) => async (req, res, next) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Token not found!');
        }
        if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
            const token = tokenWithBearer.split(' ')[1];
            try {
                // Verify token
                const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
                // Set user to header
                req.user = verifyUser;
                // Guard user
                if (roles.length && !roles.includes(verifyUser.role)) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
                }
                next();
            }
            catch (error) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.default = auth;
