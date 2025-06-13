"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferRoutes = void 0;
const express_1 = __importDefault(require("express"));
const offer_controller_1 = require("./offer.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const offer_validation_1 = require("./offer.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.BUSINESS), (0, validateRequest_1.default)(offer_validation_1.OfferValidations.create), offer_controller_1.OfferController.createOffer);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.BUSINESS, user_1.USER_ROLES.USER), offer_controller_1.OfferController.getAllOffers);
router.get('/:id', offer_controller_1.OfferController.getSingleOffer);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.BUSINESS), (0, validateRequest_1.default)(offer_validation_1.OfferValidations.update), offer_controller_1.OfferController.updateOffer);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.BUSINESS), offer_controller_1.OfferController.deleteOffer);
exports.OfferRoutes = router;
