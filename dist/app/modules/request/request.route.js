"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const request_validation_1 = require("./request.validation");
const request_controller_1 = require("./request.controller");
const router = express_1.default.Router();
router.post('/create-request', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(request_validation_1.RequestValidations.requestZodSchema), request_controller_1.RequestController.createRequest);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), request_controller_1.RequestController.getAllRequests);
exports.RequestRoutes = router;
