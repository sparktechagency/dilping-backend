import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { Notification } from './notifications.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'

const getNotifications = async (user: JwtPayload, paginationOptions: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions)
  const [result, total,unreadCount] = await Promise.all([
    Notification.find({ receiver: user.authId })
    .populate('receiver')
    .populate('sender')
    .sort({[sortBy]: sortOrder})
    .skip(skip)
    .limit(limit)
    .lean(),
    Notification.countDocuments({ receiver: user.authId }),
    Notification.countDocuments({ receiver: user.authId, isRead: false })
  ])


  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount: unreadCount
    },
    data: result
  }
}

const readNotification = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.authId, isRead: false },
    { isRead: true },
  )
  return "All notification has been marked as read successfully"
}

export const NotificationServices = {
  getNotifications,
  readNotification,
}
