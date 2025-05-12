import express from 'express'
import { RequestController } from './request.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { RequestValidations } from './request.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.USER),
  validateRequest(RequestValidations.create),
  RequestController.createRequest,
)
router.get('/', RequestController.getAllRequests)
router.get('/:id', RequestController.getSingleRequest)
router.patch('/:id', RequestController.updateRequest)
router.delete('/:id', RequestController.deleteRequest)

export const RequestRoutes = router
