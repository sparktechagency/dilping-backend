import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IUser } from './user.interface'
import { User } from './user.model'

import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { Customer } from '../customer/customer.model'

const createUser = async (
  payload: IUser,
  type: { type: 'phone' | 'email' },
): Promise<IUser | null> => {
  //check if user already exist

  const isUserExist = await User.findOne({
    [type.type]: payload[type.type],
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (isUserExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `An account with this ${type} already exist, please login or try with another email.`,
    )
  }

  const user = await User.create([payload])
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user')
  }

  //create role based user
  if (payload.role === USER_ROLES.CUSTOMER) {
    const customer = await Customer.create([{ user: user[0]._id }])
    if (!customer) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create customer')
    }
  }

  return user[0]
}

export const UserServices = { createUser }
