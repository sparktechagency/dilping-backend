"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const customerSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true
});
customerSchema.statics.getCustomerId = async function (userId) {
    const customer = await this.findOne({ user: userId });
    if (!customer) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Customer not found');
    }
    return customer === null || customer === void 0 ? void 0 : customer._id;
};
exports.Customer = (0, mongoose_1.model)('Customer', customerSchema);
