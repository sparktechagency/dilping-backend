import express from 'express'
import validateRequest  from '../../middleware/validateRequest';
import { AuthValidations } from './auth.validation';
import { AuthController } from './auth.controller';
const router = express.Router();

router.post(
    '/verify-email-or-phone-otp',
    validateRequest(AuthValidations.verifyEmailOrPhoneOtpZodSchema),
    AuthController.verifyEmailOrPhoneOtp,
);

router.post(
    '/forget-password',
    validateRequest(AuthValidations.forgetPasswordZodSchema),
    AuthController.forgetPassword,
)

router.post(
    '/reset-password',
    validateRequest(AuthValidations.resetPasswordZodSchema),
    AuthController.resetPassword,
)

export const AuthRoutes = router;