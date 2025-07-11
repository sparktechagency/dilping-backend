import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { Notification } from './notifications.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'

const getNotifications = async (user: JwtPayload, paginationOptions: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions)
  const [result, total] = await Promise.all([
    Notification.find({ receiver: user.authId })
    .populate('receiver', 'name image')
    .populate('sender', 'name image')
    .sort({[sortBy]: sortOrder})
    .skip(skip)
    .limit(limit)
    .lean(),
    Notification.countDocuments({ receiver: user.authId })
  ])


  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: result
  }
}

const readNotification = async (id: string) => {
  const result = await Notification.findByIdAndUpdate(
    new Types.ObjectId(id),
    { isRead: true },
    { new: true },
  )
  return 'Notification read successfully'
}

export const NotificationServices = {
  getNotifications,
  readNotification,
}
