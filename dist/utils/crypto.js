"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = exports.hashOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const cryptoToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.default = cryptoToken;
const hashOtp = (otp) => {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
};
exports.hashOtp = hashOtp;
const generateOtp = () => {
    return crypto_1.default.randomInt(100000, 999999).toString();
};
exports.generateOtp = generateOtp;
