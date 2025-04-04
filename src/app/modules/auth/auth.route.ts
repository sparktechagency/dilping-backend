import express from 'express'
import passport from 'passport'
import { PassportAuthController } from './passport.auth/passport.auth.controller'

import { CustomAuthController } from './custom.auth/custom.auth.controller'
import validateRequest from '../../middleware/validateRequest'
import { AuthValidations } from './auth.validation'

const router = express.Router()

router.post(
  '/login',
  validateRequest(AuthValidations.loginZodSchema),
  passport.authenticate('local', { session: false }),
  PassportAuthController.login,
)

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
)

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  PassportAuthController.googleAuthCallback,
)

router.post(
  '/custom-login',
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.customLogin,
)

export const AuthRoutes = router
