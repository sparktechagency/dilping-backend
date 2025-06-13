"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUsersInRadius = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const user_1 = require("../enum/user");
const findUsersInRadius = async (lng, lat, radiusInKm) => {
    const radiusInRadians = radiusInKm / 6378.1; // Earth's radius in km
    const users = await user_model_1.User.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusInRadians],
            },
        },
        role: user_1.USER_ROLES.BUSINESS,
    });
    return users;
};
exports.findUsersInRadius = findUsersInRadius;
