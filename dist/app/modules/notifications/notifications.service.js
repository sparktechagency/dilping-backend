"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServices = void 0;
const notifications_model_1 = require("./notifications.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const getNotifications = async (user, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const [result, total, unreadCount] = await Promise.all([
        notifications_model_1.Notification.find({ receiver: user.authId })
            .populate('receiver')
            .populate('sender')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean(),
        notifications_model_1.Notification.countDocuments({ receiver: user.authId }),
        notifications_model_1.Notification.countDocuments({ receiver: user.authId, isRead: false })
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            unreadCount: unreadCount
        },
        data: result
    };
};
const readNotification = async (user) => {
    const result = await notifications_model_1.Notification.updateMany({ receiver: user.authId, isRead: false }, { isRead: true });
    return "All notification has been marked as read successfully";
};
exports.NotificationServices = {
    getNotifications,
    readNotification,
};
