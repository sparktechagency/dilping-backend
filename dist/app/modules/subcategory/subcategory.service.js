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
exports.SubcategoryServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subcategory_model_1 = require("./subcategory.model");
const mongoose_1 = __importStar(require("mongoose"));
const category_model_1 = require("../category/category.model");
const redis_client_1 = require("../../../helpers/redis.client");
const redis_1 = require("../../../enum/redis");
const createSubcategory = async (payload) => {
    const subCategories = payload.subCategories.map((subcategory) => ({
        title: subcategory,
    }));
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const result = await subcategory_model_1.Subcategory.insertMany(subCategories, { session });
        if (!result.length) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subcategories');
        }
        const subcategoryIds = result.map((subcategory) => subcategory._id);
        const category = await category_model_1.Category.findByIdAndUpdate(new mongoose_1.Types.ObjectId(payload.category), {
            $push: { subCategories: subcategoryIds },
        }, {
            new: true,
            session,
        });
        if (!category) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
        }
        await session.commitTransaction();
        await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
        return 'Sub category created successfully.';
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Error creating subcategories:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Something went wrong, please try again.');
    }
    finally {
        await session.endSession();
    }
};
const getAllSubcategories = async () => {
    const result = await subcategory_model_1.Subcategory.find();
    return result;
};
const getSingleSubcategory = async (id) => {
    const result = await subcategory_model_1.Subcategory.findById(id);
    return result;
};
const updateSubcategory = async (id, payload) => {
    const result = await subcategory_model_1.Subcategory.findByIdAndUpdate(id, { $set: payload }, {
        new: true,
    });
    await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
    return result;
};
const deleteSubcategory = async (id) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const subcategory = await subcategory_model_1.Subcategory.findByIdAndDelete(id, { session });
        if (!subcategory)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Subcategory not found');
        //now pull the subcategory from the category
        const category = await category_model_1.Category.findOneAndUpdate({ subCategories: { $in: [subcategory._id] } }, {
            $pull: {
                subCategories: subcategory._id,
            },
        }).session(session);
        await redis_client_1.redisClient.del(redis_1.REDIS_KEYS.CATEGORIES);
        await session.commitTransaction();
        await session.endSession();
        return 'Subcategory deleted successfully.';
    }
    catch (error) {
        await session.abortTransaction();
        await session.endSession();
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete subcategory');
    }
    finally {
        await session.endSession();
    }
};
exports.SubcategoryServices = {
    createSubcategory,
    getAllSubcategories,
    getSingleSubcategory,
    updateSubcategory,
    deleteSubcategory,
};
