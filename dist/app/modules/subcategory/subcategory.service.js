"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoryServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const subcategory_model_1 = require("./subcategory.model");
const mongoose_1 = __importDefault(require("mongoose"));
const category_model_1 = require("../category/category.model");
const createSubcategory = async (payload) => {
    const subCategories = payload.subCategories.map((subcategory) => {
        return {
            title: subcategory,
        };
    });
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const result = await subcategory_model_1.Subcategory.create(subCategories, { session });
        if (!result)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subcategories');
        //now push the subcategories into the category
        const category = await category_model_1.Category.findByIdAndUpdate(payload.category, {
            $push: {
                subCategories: result.map((subcategory) => subcategory._id),
            },
        }, {
            new: true,
        }).session(session);
        await session.commitTransaction();
        await session.endSession();
        return 'Sub category created successfully.';
    }
    catch (error) {
        await session.abortTransaction();
        await session.endSession();
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subcategories');
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
    return result;
};
const deleteSubcategory = async (id) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const subcategory = await subcategory_model_1.Subcategory.findByIdAndDelete(id, { session });
        console.log(subcategory);
        if (!subcategory)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Subcategory not found');
        //now pull the subcategory from the category
        const category = await category_model_1.Category.findOneAndUpdate({ subCategories: { $in: [subcategory._id] } }, {
            $pull: {
                subCategories: subcategory._id,
            },
        }).session(session);
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
