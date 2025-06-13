"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const notifications_model_1 = require("../app/modules/notifications/notifications.model");
const logger_1 = require("../shared/logger");
const socket_1 = require("../utils/socket");
const sendNotification = async (sender, receiver, title, body) => {
    try {
        const result = await notifications_model_1.Notification.create({
            sender,
            receiver,
            title,
            body,
            isRead: false,
        });
        if (!result)
            logger_1.logger.warn('Notification not sent');
        const populatedResult = (await result.populate('sender', { profile: 1, name: 1 })).populate('receiver', { profile: 1, name: 1 });
        socket_1.socket.emit('notification', populatedResult);
    }
    catch (err) {
        //@ts-ignore
        logger_1.logger.error(err, 'FROM NOTIFICATION HELPER');
    }
};
exports.sendNotification = sendNotification;
