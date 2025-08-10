"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestUtils = void 0;
const user_1 = require("../../../enum/user");
const user_model_1 = require("../user/user.model");
const notificationHelper_1 = require("../../../helpers/notificationHelper");
const logger_1 = require("../../../shared/logger");
const getBusinessesWithinRadius = async (radius, latitude, longitude, session, category, subCategories) => {
    const businesses = await user_model_1.User.find({
        role: user_1.USER_ROLES.BUSINESS,
        status: user_1.USER_STATUS.ACTIVE,
        category: category,
        subCategories: { $in: subCategories },
        location: {
            $geoWithin: {
                $centerSphere: [[longitude, latitude], radius / 3963.2],
            },
        },
    }).session(session);
    return businesses;
};
const sendRequestNotificationsToBusinessesWithData = async (user, request, chats) => {
    // Batch process notifications
    const notificationPromises = chats.map(chat => (0, notificationHelper_1.sendNotification)({
        title: request.message,
        body: `${user.name} has sent you a request, to view the request please open request list.`,
        sender: user.authId,
        receiver: chat.participants[1].toString(),
    }));
    await Promise.all(notificationPromises).catch(err => logger_1.logger.error('Failed to send some notifications', err));
};
exports.RequestUtils = {
    getBusinessesWithinRadius,
    sendRequestNotificationsToBusinessesWithData,
};
