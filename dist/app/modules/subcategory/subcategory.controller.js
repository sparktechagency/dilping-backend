"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoryController = void 0;
const subcategory_service_1 = require("./subcategory.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createSubcategory = (0, catchAsync_1.default)(async (req, res) => {
    const subcategoryData = req.body;
    const result = await subcategory_service_1.SubcategoryServices.createSubcategory(subcategoryData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Subcategory created successfully',
        data: result,
    });
});
const updateSubcategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const subcategoryData = req.body;
    const result = await subcategory_service_1.SubcategoryServices.updateSubcategory(id, subcategoryData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subcategory updated successfully',
        data: result,
    });
});
const getSingleSubcategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await subcategory_service_1.SubcategoryServices.getSingleSubcategory(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subcategory retrieved successfully',
        data: result,
    });
});
const getAllSubcategories = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subcategory_service_1.SubcategoryServices.getAllSubcategories();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subcategorys retrieved successfully',
        data: result,
    });
});
const deleteSubcategory = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await subcategory_service_1.SubcategoryServices.deleteSubcategory(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subcategory deleted successfully',
        data: result,
    });
});
exports.SubcategoryController = {
    createSubcategory,
    updateSubcategory,
    getSingleSubcategory,
    getAllSubcategories,
    deleteSubcategory,
};
