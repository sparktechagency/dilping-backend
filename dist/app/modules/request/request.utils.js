"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestUtils = void 0;
const user_1 = require("../../../enum/user");
const lucide_react_native_1 = require("lucide-react-native");
const getBusinessesWithingRadius = async (radius, latitude, longitude, session) => {
    const businesses = await lucide_react_native_1.User.find({
        role: user_1.USER_ROLES.BUSINESS,
        status: user_1.USER_STATUS.ACTIVE,
        location: {
            $geoWithin: {
                $centerSphere: [[longitude, latitude], radius / 3963.2],
            },
        },
    }).session(session);
    return businesses;
};
exports.RequestUtils = {
    getBusinessesWithingRadius,
};
