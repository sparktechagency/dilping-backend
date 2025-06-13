"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServices = void 0;
const mongoose_1 = require("mongoose");
const notifications_model_1 = require("./notifications.model");
const getNotifications = (user) => {
    const result = notifications_model_1.Notification.find({ user: user.authId })
        .populate('receiver', 'name image')
        .populate('sender', 'name image')
        .lean();
    return result;
};
const readNotification = async (id) => {
    const result = await notifications_model_1.Notification.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { isRead: true }, { new: true });
    return result;
};
exports.NotificationServices = {
    getNotifications,
    readNotification,
};
