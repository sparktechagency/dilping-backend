"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const request_service_1 = require("./request.service");
const http_status_codes_1 = require("http-status-codes");
const createRequest = (0, catchAsync_1.default)(async (req, res) => {
    const { ...requestData } = req.body;
    const result = await request_service_1.RequestService.createRequest(req.user, requestData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Request created successfully',
        data: result,
    });
});
const getAllRequests = (0, catchAsync_1.default)(async (req, res) => {
    const result = await request_service_1.RequestService.getAllRequests(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Requests retrieved successfully',
        data: result,
    });
});
exports.RequestController = {
    createRequest,
    getAllRequests,
};
