import express from 'express'
import { OfferController } from './offer.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { OfferValidations } from './offer.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.BUSINESS),
  validateRequest(OfferValidations.create),
  OfferController.createOffer,
)
router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER),
  OfferController.getAllOffers,
)
router.get('/:id', OfferController.getSingleOffer)
router.patch(
  '/:id',
  auth(USER_ROLES.BUSINESS),
  validateRequest(OfferValidations.update),
  OfferController.updateOffer,
)
router.delete('/:id', auth(USER_ROLES.BUSINESS), OfferController.deleteOffer)

export const OfferRoutes = router
