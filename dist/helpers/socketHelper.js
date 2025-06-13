"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = void 0;
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const server_1 = require("../server");
const notifications_model_1 = require("../app/modules/notifications/notifications.model");
const socketMiddleware_1 = require("../app/middleware/socketMiddleware");
const user_1 = require("../enum/user");
const socket = (io) => {
    // Apply authentication middleware to all connections
    io.use(socketMiddleware_1.socketMiddleware.socketAuth(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.BUSINESS));
    io.on('connection', (socket) => {
        if (socket.user) {
            server_1.onlineUsers.set(socket.id, socket.user.authId);
            logger_1.logger.info(colors_1.default.blue(`⚡ User ${socket.user.authId} connected`));
            // Send notifications only on initial connection
            sendNotificationsToAllConnectedUsers(socket);
            registerEventHandlers(socket);
        }
    });
};
// Separate function to register all event handlers
const registerEventHandlers = (socket) => {
    socket.on('request', async (data) => {
        try {
            //authorize the request here
            socketMiddleware_1.socketMiddleware.handleSocketRequest(socket, user_1.USER_ROLES.ADMIN);
            //validate the request here
            // const validatedData = socketMiddleware.validateEventData(
            //   socket,
            //   RequestValidations.create,
            //   JSON.parse(data),
            // )
            // if (!validatedData) return
            // const request = validatedData as IRequest
            //handle the request here
            // await RequestService.createRequest(
            //   socket,
            //   request as IRequest & { coordinates: [number, number]; radius: number },
            // )
        }
        catch (error) {
            logger_1.logger.error('Error handling request:', error);
        }
    });
    // Disconnect handler
    socket.on('disconnect', () => {
        var _a;
        server_1.onlineUsers.delete(socket.id);
        logger_1.logger.info(colors_1.default.red(`User ${((_a = socket.user) === null || _a === void 0 ? void 0 : _a.authId) || 'Unknown'} disconnected ⚡`));
    });
};
const sendNotificationsToAllConnectedUsers = async (socket) => {
    var _a;
    try {
        const userId = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.authId;
        if (!userId)
            return;
        const [notifications, unreadCount] = await Promise.all([
            notifications_model_1.Notification.find({ receiver: userId }).lean(),
            notifications_model_1.Notification.countDocuments({ receiver: userId, isRead: false }),
        ]);
        socket.emit(`notification::${userId}`, {
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        logger_1.logger.error('Error sending notifications:', error);
    }
};
exports.socketHelper = {
    socket,
    sendNotificationsToAllConnectedUsers,
};
