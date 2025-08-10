"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDataWithSocket = exports.sendNotification = void 0;
const notifications_model_1 = require("../app/modules/notifications/notifications.model");
const logger_1 = require("../shared/logger");
const sendNotification = async (data) => {
    try {
        const result = await notifications_model_1.Notification.create({
            sender: data.sender,
            receiver: data.receiver,
            title: data.title,
            body: data.body,
            isRead: false,
        }).then(doc => doc.populate([
            { path: 'sender' },
        ]));
        if (!result) {
            logger_1.logger.warn('Notification not sent');
            return;
        }
        //@ts-ignore
        const socket = global.io;
        socket.emit(`notification::${data.receiver}`, result);
    }
    catch (err) {
        //@ts-ignore
        logger_1.logger.error(err, 'FROM NOTIFICATION HELPER');
    }
};
exports.sendNotification = sendNotification;
const sendDataWithSocket = (namespace, receiverId, data) => {
    try {
        //@ts-ignore
        const socket = global.io;
        socket.emit(`${namespace}::${receiverId}`, { data });
    }
    catch (error) {
        logger_1.logger.error('Failed to send data with socket:', error);
    }
};
exports.sendDataWithSocket = sendDataWithSocket;
