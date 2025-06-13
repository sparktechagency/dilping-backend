import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { RequestValidations } from './request.validation'
import { RequestController } from './request.controller'

const router = express.Router()

router.post(
  '/create-request',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest(RequestValidations.requestZodSchema),
  RequestController.createRequest,
)

router.get('/', auth(USER_ROLES.USER), RequestController.getAllRequests)

export const RequestRoutes = router
