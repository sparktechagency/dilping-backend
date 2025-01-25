import { AuthHelper } from './auth.helper';
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IEmailOrPhoneOtpVerification, IForgetPassword, IResetPassword, IVerificationResponse } from './auth.interface'
import { Verification } from '../verification/verification.model'
import { User } from '../user/user.model'
import { verificationHelper } from '../verification/verification.utils';
import bcrypt from 'bcrypt'

const verifyEmailOrPhoneOtp = async (payload: IEmailOrPhoneOtpVerification): Promise<IVerificationResponse> => {

        // Input validation
        if (!payload.oneTimeCode) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP is required')
        }
        if (!payload.email && !payload.phone) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Either email or phone is required')
        }

        const query = payload.email ? { email: payload.email } : { phone: payload.phone }
        const identifier = payload.email ? 'email' : 'phone'
        const now = new Date()

        // Fetch verification record
        const verification = await Verification.findOne(query)
        if (!verification) {
            throw new ApiError(StatusCodes.NOT_FOUND, `No OTP found for the given ${identifier}`)
        }

        // Check OTP validity
        await AuthHelper.validateOtp(verification, payload.oneTimeCode)

        // Check OTP expiration
        if (now > verification.expiresAt) {
            await Verification.deleteOne({ _id: verification._id })
            throw new ApiError(StatusCodes.GONE, 'OTP has expired')
        }

        // Find the user
        const user = await User.findOne(query)
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
        }

        // Handle verification type
        const message = await AuthHelper.handleVerificationType(verification, user)

        // Delete OTP if it's for account creation
        if (verification.type === 'createAccount') {
            await User.findByIdAndUpdate(user._id, { verified: true })
            await Verification.deleteOne({ _id: verification._id })
        }

        return { verified: true, message }
  
}

const forgetPassword = async (payload: IForgetPassword) => {

        const {email, phone} = payload
        // Input validation
        if (!email && !phone) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Either email or phone is required')
        }

        const query = email ? { email } : { phone }
        const identifier = email ? 'email' : 'phone'

        const user = await User.findOne(query)
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, `No user found with this ${identifier}`)
        }


        //send OTP
        await verificationHelper.sendOtpToEmailOrPhone({
            name: user.name,
            ...(email && { email } || { phone }),
            // phone: user.phone,
            type: 'resetPassword'
        })

        return `Please check your ${identifier} for the OTP`

}


const resetPassword = async (payload: IResetPassword) => {

        const {email, phone, newPassword, confirmPassword} = payload
        // Input validation
        if (!email && !phone) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Either email or phone is required')
        }

        const query = email ? { email: email } : { phone: phone }
        const identifier = email ? 'email' : 'phone'

        if(newPassword !== confirmPassword){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'New password and confirm password does not matched')
        }

        const [user, verification] = await Promise.all([
            User.findOne(query),
            Verification.findOne(query),
        ]);

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, `No user found with this ${identifier}`)
        }
        if (!verification || verification.resetPassword !== true) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "You don't have the permission to reset password, please try again with forget password")
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        // Update the user's password
        user.password = hashedPassword
        await User.findByIdAndUpdate(user._id, {$set:{password: hashedPassword, passwordChangedAt: new Date()}})

        // Delete the OTP
        await Verification.deleteOne({ identifier })

        return `Password reset successful for ${identifier}`
    
}

export const AuthServices = {
    verifyEmailOrPhoneOtp,
    forgetPassword,
    resetPassword
}