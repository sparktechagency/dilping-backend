import { StatusCodes } from 'http-status-codes'
import { User } from '../../user/user.model'
import { AuthHelper } from '../auth.helper'
import ApiError from '../../../../errors/ApiError'
import { USER_STATUS } from '../../../../enum/user'
import config from '../../../../config'
import { Token } from '../../token/token.model'
import { IResetPassword } from '../auth.interface'
import { emailHelper } from '../../../../helpers/emailHelper'
import { emailTemplate } from '../../../../shared/emailTemplate'
import { generateOtp } from '../../../../utils/crypto'
import bcrypt from 'bcrypt'
import { ILoginData } from '../../../../interfaces/auth'
import { AuthCommonServices } from '../common'

const customLogin = async (payload: ILoginData) => {
  const { email, phone } = payload
  const query = email ? { email: email } : { phone: phone }

  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })
    .select('+password +authentication')
    .lean()
  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `No account found with this ${email ? 'email' : 'phone'}`,
    )
  }

  const result = await AuthCommonServices.handleLoginLogic(payload, isUserExist)

  return result
}

const forgetPassword = async (email?: string, phone?: string) => {
  const query = email ? { email: email } : { phone: phone }
  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })

  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No account found with this email or phone',
    )
  }

  const otp = generateOtp()
  const authentication = {
    oneTimeCode: otp,
    resetPassword: true,
    latestRequestAt: new Date(),
    requestCount: 1,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    authType: 'resetPassword',
  }

  //send otp to user
  if (email) {
    const forgetPasswordEmailTemplate = emailTemplate.resetPassword({
      name: isUserExist.name as string,
      email: isUserExist.email as string,
      otp,
    })
    emailHelper.sendEmail(forgetPasswordEmailTemplate)
  }

  if (phone) {
    //implement this feature using twilio/aws sns
  }

  await User.findByIdAndUpdate(isUserExist._id, { $set: { authentication } })
  return { message: 'OTP sent successfully' }
}

const resetPassword = async (resetToken: string, payload: IResetPassword) => {
  const { newPassword, confirmPassword } = payload
  if (newPassword !== confirmPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match')
  }

  const isTokenExist = await Token.findOne({ token: resetToken }).lean()
  if (!isTokenExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You don't have authorization to reset your password",
    )
  }

  const isUserExist = await User.findById(isTokenExist.user)
    .select('+authentication')
    .lean()
  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Something went wrong, please try again.',
    )
  }

  const { authentication } = isUserExist
  if (!authentication?.resetPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You don\'t have permission to change the password. Please click again to "Forgot Password"',
    )
  }

  const isTokenValid = authentication?.expiresAt! > new Date()
  if (!isTokenValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your reset token has expired, please try again.',
    )
  }

  const hashPassword = bcrypt.hash(
    newPassword,
    config.bcrypt_salt_rounds as string,
  )
  const updatedUserData = {
    password: hashPassword,
    authentication: {
      resetPassword: false,
    },
  }

  await User.findByIdAndUpdate(
    isUserExist._id,
    { $set: updatedUserData },
    { new: true },
  )

  return { message: 'Password reset successfully' }
}

const verifyAccount = async (
  onetimeCode: string,
  email?: string,
  phone?: string,
) => {
  //verify fo new user

  if (!onetimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP is required')
  }

  const query = email ? { email: email } : { phone: phone }

  const isUserExist = await User.findOne({
    ...query,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })
    .select('+authentication')
    .lean()
  if (!isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No account found with this email or phone',
    )
  }

  const { authentication } = isUserExist
  if (authentication?.oneTimeCode !== onetimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You provided wrong OTP, please try again.',
    )
  }

  const currentDate = new Date()
  if (authentication?.expiresAt! < currentDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'OTP has expired, please try again.',
    )
  }

  const returnable = {
    message: '',
    token: '',
  }
  if (!isUserExist.verified) {
    await User.findByIdAndUpdate(
      isUserExist._id,
      { $set: { verified: true } },
      { new: true },
    )
    returnable.message = 'Account verified successfully'
  } else {
    const authentication = {
      oneTimeCode: null,
      resetPassword: true,
    }
    await User.findByIdAndUpdate(
      isUserExist._id,
      { $set: { authentication } },
      { new: true },
    )

    const resetToken = AuthHelper.createToken(isUserExist._id, isUserExist.role)
    returnable.token = resetToken.accessToken
    returnable.message =
      'OTP verified successfully, please reset your password.'
  }
  return returnable
}

export const CustomAuthServices = {
  forgetPassword,
  resetPassword,
  verifyAccount,
  customLogin,
}
