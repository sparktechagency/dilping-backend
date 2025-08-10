"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("./chat.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router.post('/', chat_controller_1.ChatController.createChat);
router.get('/businesses', (0, auth_1.default)(user_1.USER_ROLES.BUSINESS), chat_controller_1.ChatController.getAllChatForBusinesses);
router.get('/user/:requestId', (0, auth_1.default)(user_1.USER_ROLES.USER), chat_controller_1.ChatController.getAllChatsForUser);
router.get('/:id', chat_controller_1.ChatController.getSingleChat);
router.patch('/:id', chat_controller_1.ChatController.updateChat);
router.delete('/:id', chat_controller_1.ChatController.deleteChat);
exports.ChatRoutes = router;
