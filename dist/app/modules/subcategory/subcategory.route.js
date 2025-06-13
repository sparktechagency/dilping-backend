"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const subcategory_controller_1 = require("./subcategory.controller");
const router = express_1.default.Router();
router.post('/', subcategory_controller_1.SubcategoryController.createSubcategory);
router.get('/', subcategory_controller_1.SubcategoryController.getAllSubcategories);
router.get('/:id', subcategory_controller_1.SubcategoryController.getSingleSubcategory);
router.patch('/:id', subcategory_controller_1.SubcategoryController.updateSubcategory);
router.delete('/:id', subcategory_controller_1.SubcategoryController.deleteSubcategory);
exports.SubcategoryRoutes = router;
