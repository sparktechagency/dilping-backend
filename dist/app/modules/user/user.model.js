"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enum/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const redis_client_1 = require("../../../helpers/redis.client");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    eiin: {
        type: String,
    },
    license: {
        type: String,
    },
    businessName: {
        type: String,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        populate: { path: 'category', select: 'title icon' }
    },
    subCategories: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Subcategory',
        populate: { path: 'subcategories', select: 'title' }
    },
    rating: {
        type: Number,
        default: 0,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    zipCode: {
        type: Number,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            default: [0.0, 0.0], // [longitude, latitude]
        },
    },
    status: {
        type: String,
        enum: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED, user_1.USER_STATUS.DELETED],
        default: user_1.USER_STATUS.ACTIVE,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    profile: {
        type: String,
        default: '',
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    reportCount: {
        type: Number,
        default: 0,
    },
    h3Index: {
        type: String,
        default: null,
    },
    h3Res: {
        type: Number,
        default: 9,
    },
    role: {
        type: String,
        default: user_1.USER_ROLES.USER,
    },
    appId: {
        type: String,
    },
    deviceToken: {
        type: String,
    },
    authentication: {
        _id: false,
        select: false,
        type: {
            restrictionLeftAt: {
                type: Date,
                default: null,
            },
            resetPassword: {
                type: Boolean,
                default: false,
            },
            wrongLoginAttempts: {
                type: Number,
                default: 0,
            },
            passwordChangedAt: {
                type: Date,
                default: null,
            },
            oneTimeCode: {
                type: String,
                default: null,
            },
            latestRequestAt: {
                type: Date,
                default: null,
            },
            expiresAt: {
                type: Date,
                default: null,
            },
            requestCount: {
                type: Number,
                default: 0,
            },
            authType: {
                type: String,
                default: null,
            },
        },
    },
}, {
    timestamps: true,
});
userSchema.index({ location: '2dsphere' });
userSchema.index({ h3Index: 1 });
userSchema.statics.isPasswordMatched = async function (givenPassword, savedPassword) {
    return await bcrypt_1.default.compare(givenPassword, savedPassword);
};
// Update H3 index when location changes
// Invalidate cache when business location changes
const invalidateCache = async function (business) {
    if (business.role !== user_1.USER_ROLES.BUSINESS)
        return;
    const oldHex = business.previous('h3Index');
    const newHex = business.h3Index;
    const hexesToInvalidate = new Set();
    if (oldHex)
        hexesToInvalidate.add(oldHex);
    if (newHex)
        hexesToInvalidate.add(newHex);
    // Delete all cache keys related to these hexes
    await Promise.all(Array.from(hexesToInvalidate).map(hex => redis_client_1.redisClient.del(`business:hex:${hex}`)));
};
userSchema.pre('save', async function (next) {
    //find the user by email
    const isExist = await exports.User.findOne({
        email: this.email,
        status: { $in: [user_1.USER_STATUS.ACTIVE, user_1.USER_STATUS.RESTRICTED] },
    });
    if (isExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'An account with this email already exists');
    }
    this.password = await bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
    next();
});
exports.User = (0, mongoose_1.model)('User', userSchema);
