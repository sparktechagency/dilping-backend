import { Request, Response, NextFunction } from 'express'

import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { IUser } from './user.interface'
import { UserServices } from './user.service'

const createUser = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body
  const user = await UserServices.createUser(userData)
  sendResponse<IUser>(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'User created successfully',
    data: user,
  })
})

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { image, ...userData } = req.body


  if (image?.length > 0) userData.profile = image[0]
  const result = await UserServices.updateProfile(req.user!, userData)
  sendResponse<String>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  })
})

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getProfile(req.user!)
  sendResponse<IUser>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  })
})

const createRating = catchAsync(async (req: Request, res: Response) => {
  const { rating } = req.body
  const reviewTo = req.params.reviewTo
  const result = await UserServices.createRating(rating, reviewTo)
  sendResponse<String>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rating created successfully',
    data: result,
  })
})

export const UserController = {
  createUser,
  updateProfile,
  getProfile,
  createRating,
}
