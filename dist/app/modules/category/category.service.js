"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const category_model_1 = require("./category.model");
const mongoose_1 = __importStar(require("mongoose"));
const subcategory_model_1 = require("../subcategory/subcategory.model");
const redis_1 = require("../../../enum/redis");
const redis_client_1 = require("../../../helpers/redis.client");
const createCategory = async (payload) => {
    const result = await category_model_1.Category.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Category');
    await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
    return result;
};
const getAllCategories = async () => {
    const cacheKey = redis_1.REDIS_KEYS.CATEGORIES;
    const cachedResult = await redis_client_1.redisClient.get(cacheKey);
    if (cachedResult) {
        return JSON.parse(cachedResult);
    }
    const result = await category_model_1.Category.find()
        .populate({
        path: 'subCategories',
        select: {
            _id: 1,
            title: 1,
        },
    })
        .lean();
    await redis_client_1.redisClient.setex(cacheKey, 86400, JSON.stringify(result));
    return result;
};
const getSingleCategory = async (id) => {
    const cacheKey = redis_1.REDIS_KEYS.CATEGORIES;
    try {
        const cachedCategories = await redis_client_1.redisClient.get(cacheKey);
        if (cachedCategories) {
            const categories = JSON.parse(cachedCategories);
            const category = categories.find((cat) => cat._id === id || cat._id === new mongoose_1.Types.ObjectId(id).toString());
            if (category) {
                return category;
            }
        }
        return await getSingleCategoryFromDB(id);
    }
    catch (error) {
        return await getSingleCategoryFromDB(id);
    }
};
const getSingleCategoryFromDB = async (id) => {
    const result = await category_model_1.Category.findById(id)
        .populate({
        path: 'subCategories',
        select: '_id title',
    })
        .lean();
    return result;
};
const updateCategory = async (id, payload) => {
    const result = await category_model_1.Category.findByIdAndUpdate(id, { $set: payload }, {
        new: true,
    });
    await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
    return result;
};
const deleteCategory = async (id) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const result = await category_model_1.Category.findByIdAndDelete(id, { session });
        if (!result)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete Category');
        // Delete all subcategories associated with the category
        await subcategory_model_1.Subcategory.deleteMany({ _id: { $in: result.subCategories } }, { session });
        await session.commitTransaction();
        await session.endSession();
        return 'Category deleted successfully.';
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
        await session.endSession();
    }
};
exports.CategoryServices = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
