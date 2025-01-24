import express from 'express';
import { UserController } from './user.controller';
import { UserValidations } from './user.validation';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();


router.post(
    '/create-user',
    validateRequest(UserValidations.createUserZodSchema),
    UserController.createUser,
);

export const UserRoutes = router;
