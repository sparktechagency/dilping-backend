import express from 'express';
import { SubcategoryController } from './subcategory.controller';

const router = express.Router();

router.post('/', SubcategoryController.createSubcategory);
router.get('/', SubcategoryController.getAllSubcategorys);
router.get('/:id', SubcategoryController.getSingleSubcategory);
router.patch('/:id', SubcategoryController.updateSubcategory);
router.delete('/:id', SubcategoryController.deleteSubcategory);

export const SubcategoryRoutes = router;
