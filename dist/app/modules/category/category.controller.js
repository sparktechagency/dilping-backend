"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("./category.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createCategory = (0, catchAsync_1.default)(async (req, res) => {
    const categoryData = req.body;
    const { image, ...restItem } = categoryData;
    if ((image === null || image === void 0 ? void 0 : image.length) > 0) {
        restItem.icon = image[0];
    }
    if (!restItem.icon) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please provide an icon');
    }
    const result = await category_service_1.CategoryServices.createCategory(restItem);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Category created successfully',
        data: result,
    });
});
const updateCategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const categoryData = req.body;
    const { image, ...restItem } = categoryData;
    if ((image === null || image === void 0 ? void 0 : image.length) > 0) {
        restItem.icon = image[0];
    }
    console.log(restItem);
    const result = await category_service_1.CategoryServices.updateCategory(id, restItem);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Category updated successfully',
        data: result,
    });
});
const getSingleCategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await category_service_1.CategoryServices.getSingleCategory(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Category retrieved successfully',
        data: result,
    });
});
const getAllCategories = (0, catchAsync_1.default)(async (req, res) => {
    const result = await category_service_1.CategoryServices.getAllCategories();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Categories retrieved successfully',
        data: result,
    });
});
const deleteCategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await category_service_1.CategoryServices.deleteCategory(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Category deleted successfully',
        data: result,
    });
});
exports.CategoryController = {
    createCategory,
    updateCategory,
    getSingleCategory,
    getAllCategories,
    deleteCategory,
};
