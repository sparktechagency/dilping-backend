"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enum/user");
const auth_1 = __importDefault(require("../../middleware/auth"));
const message_controller_1 = require("./message.controller");
const message_validation_1 = require("./message.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const processReqBody_1 = require("../../middleware/processReqBody");
const router = express_1.default.Router();
router.get('/:chatId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.BUSINESS), message_controller_1.MessageController.getMessageByChat);
router.post('/:chatId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.BUSINESS), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(message_validation_1.MessageValidations.create), message_controller_1.MessageController.sendMessage);
router.patch('/:chatId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.BUSINESS), message_controller_1.MessageController.enableChat);
exports.MessageRoutes = router;
