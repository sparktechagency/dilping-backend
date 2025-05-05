import express from 'express'
import { CategoryController } from './category.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'
import validateRequest from '../../middleware/validateRequest'
import { CategoryValidations } from './category.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(CategoryValidations.create),
  CategoryController.createCategory,
)
router.get('/', CategoryController.getAllCategories)
router.get('/:id', CategoryController.getSingleCategory)
router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(CategoryValidations.update),
  CategoryController.updateCategory,
)
router.delete('/:id', CategoryController.deleteCategory)

export const CategoryRoutes = router
