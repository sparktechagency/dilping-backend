"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../config"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const logger_1 = require("../../shared/logger");
const colors_1 = __importDefault(require("colors"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const socketAuth = (...roles) => {
    return (socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                socket.handshake.query.token ||
                socket.handshake.headers.authorization;
            logger_1.logger.info(colors_1.default.green(`Socket authentication attempt`));
            if (!token) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Authentication token is required to access this resource');
            }
            try {
                let jwtToken = extractToken(token);
                // Verify token
                const verifiedUser = jwtHelper_1.jwtHelper.verifyToken(jwtToken, config_1.default.jwt.jwt_secret);
                // Attach user to socket
                socket.user = {
                    authId: verifiedUser.authId,
                    role: verifiedUser.role,
                    ...verifiedUser,
                };
                // Guard user based on roles
                if (roles.length && !roles.includes(verifiedUser.role)) {
                    logger_1.logger.error(colors_1.default.red(`Socket authentication failed: User role ${verifiedUser.role} not authorized`));
                    return next(new Error("You don't have permission to access this socket event"));
                }
                logger_1.logger.info(colors_1.default.green(`Socket authenticated for user: ${verifiedUser.authId}`));
                next();
            }
            catch (error) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
            }
        }
        catch (error) {
            if (error instanceof ApiError_1.default) {
                const apiError = error;
                const errorResponse = {
                    statusCode: apiError.statusCode,
                    error: getErrorName(apiError.statusCode),
                    message: apiError.message,
                };
                socket.emit('socket_error', errorResponse);
            }
            next(error);
        }
    };
};
/**
 * Event-specific authorization middleware
 * Verifies user has permission to access specific event
 */
/**
 * Validate socket event data against schema
 */
const validateEventData = (socket, schema, data) => {
    try {
        return schema.parse(data);
    }
    catch (error) {
        const zodError = (0, handleZodError_1.default)(error);
        socket.emit('socket_error', {
            statusCode: zodError.statusCode,
            error: getErrorName(zodError.statusCode),
            message: zodError.message,
            errorMessages: zodError.errorMessages,
        });
        return null;
    }
};
const handleSocketRequest = (socket, ...roles) => {
    try {
        const token = socket.handshake.auth.token ||
            socket.handshake.query.token ||
            socket.handshake.headers.authorization;
        let jwtToken = extractToken(token);
        // Verify token
        const verifiedUser = jwtHelper_1.jwtHelper.verifyToken(jwtToken, config_1.default.jwt.jwt_secret);
        // Guard user based on roles
        if (roles.length && !roles.includes(verifiedUser.role)) {
            socket.emit('socket_error', createErrorResponse(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this socket event"));
            return null;
        }
        return {
            ...verifiedUser,
        };
    }
    catch (error) {
        handleSocketError(socket, error);
        return null;
    }
};
// Helper functions
function extractToken(token) {
    // if (typeof token === 'string') {
    //   if (token.includes('{')) {
    //     try {
    //       const parsedToken = JSON.parse(token)
    //       return parsedToken?.token?.split(' ')[1] || parsedToken?.token || token
    //     } catch {
    //       // If parsing fails, continue with other methods
    //     }
    //   }
    //   if (token.startsWith('Bearer ')) {
    //     return token.split(' ')[1]
    //   }
    // }
    return token;
}
function createErrorResponse(statusCode, message, errorMessages) {
    return {
        statusCode,
        error: getErrorName(statusCode),
        message,
        ...(errorMessages && { errorMessages }),
    };
}
function getErrorName(statusCode) {
    switch (statusCode) {
        case http_status_codes_1.StatusCodes.BAD_REQUEST:
            return 'Bad Request';
        case http_status_codes_1.StatusCodes.UNAUTHORIZED:
            return 'Unauthorized';
        case http_status_codes_1.StatusCodes.FORBIDDEN:
            return 'Forbidden';
        case http_status_codes_1.StatusCodes.NOT_FOUND:
            return 'Not Found';
        default:
            return 'Error';
    }
}
function handleSocketError(socket, error) {
    if (error instanceof ApiError_1.default) {
        socket.emit('socket_error', createErrorResponse(error.statusCode, error.message));
    }
    else {
        socket.emit('socket_error', createErrorResponse(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error'));
    }
    logger_1.logger.error(colors_1.default.red(`Socket error: ${error.message}`), error);
}
exports.socketMiddleware = {
    socketAuth,
    validateEventData,
    handleSocketRequest, // Kept for backward compatibility
};
