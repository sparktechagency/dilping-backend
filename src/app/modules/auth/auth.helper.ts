import { StatusCodes } from "http-status-codes"
import ApiError from "../../../errors/ApiError"
import { IVerification } from "../verification/verification.interface"
import { IUser } from "../user/user.interface"
import { User } from "../user/user.model"
import { Verification } from "../verification/verification.model"
import bcrypt from 'bcrypt'

// Helper to validate OTP
const validateOtp = async (verification: IVerification, otp: string): Promise<void> => {
   
    const isCodeValid = await bcrypt.compare(otp, verification.oneTimeCode)
    if (!isCodeValid) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials') // Avoid revealing OTP mismatch
    }
}

// Helper to handle verification types
const handleVerificationType = async (verification: IVerification, user: IUser): Promise<string> => {
    if (verification.type === 'createAccount') {
        // Mark user as verified
        await User.updateOne({ _id: user._id }, { $set: { isVerified: true } })
        return 'Account verified successfully'
    } else if (verification.type === 'resetPassword') {
        // Mark verification record as valid for password reset
        await Verification.updateOne(
            { _id: verification._id },
            { $set: { resetPassword: true, passwordChangedAt: new Date() } }
        )
        return 'OTP verified. You can now reset your password'
    }
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid verification type')
}

export const AuthHelper = {
    handleVerificationType,
    validateOtp
}