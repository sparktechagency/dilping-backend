import express from 'express';
import { SupportController } from './support.controller';

import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { SupportValidations } from './support.validation';
const router = express.Router();

router.post('/', auth(USER_ROLES.USER, USER_ROLES.BUSINESS),validateRequest(SupportValidations.create), SupportController.createSupport);
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER), SupportController.getAllSupports);
router.get('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER), SupportController.getSingleSupport);
router.patch('/:id', auth(USER_ROLES.ADMIN),validateRequest(SupportValidations.update), SupportController.updateSupport);
router.delete('/:id', auth(USER_ROLES.ADMIN), SupportController.deleteSupport);

export const SupportRoutes = router;
