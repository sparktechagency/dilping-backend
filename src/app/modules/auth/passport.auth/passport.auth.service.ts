import { USER_STATUS } from '../../../../enum/user'
import { ILoginData } from '../../../../interfaces/auth'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../../errors/ApiError'
import { User } from '../../user/user.model'

import { IUser } from '../../user/user.interface'
import { AuthHelper } from '../auth.helper'

const handleGoogleLogin = async (payload: IUser & { profile: any }) => {
  const { emails, photos, displayName, id } = payload.profile
  const email = emails[0].value.toLowerCase()
  const isUserExist = await User.findOne({
    email,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })
  if (isUserExist) {
    //return only the token
    const tokens = AuthHelper.createToken(isUserExist._id, isUserExist.role,isUserExist.name ? isUserExist.name : "",isUserExist.email ? isUserExist.email : "")
    return {
      status: StatusCodes.OK,
      message: `Welcome back ${isUserExist.name ? isUserExist.name : "" }`,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: isUserExist.role,
    }
  }

  const session = await User.startSession()
  session.startTransaction()

  const userData = {
    email: emails[0].value,
    profile: photos[0].value,
    name: displayName,
    verified: true,
    password: id,
    status: USER_STATUS.ACTIVE,
    appId: id,
    role: payload.role,
  }

  try {
    const user = await User.create([userData], { session })
    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user')
    }

    //create token
    const tokens = AuthHelper.createToken(user[0]._id, user[0].role,user[0].name ? user[0].name : "",user[0].email ? user[0].email : "")

    await session.commitTransaction()
    await session.endSession()

    return {
      status: StatusCodes.OK,
      message: `Welcome back ${user[0].name ? user[0].name : "" }`,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user[0].role,
    }
  } catch (error) {
    await session.abortTransaction(session)
    session.endSession()
    throw error
  } finally {
    await session.endSession()
  }
}

export const PassportAuthServices = {
  handleGoogleLogin,
}
