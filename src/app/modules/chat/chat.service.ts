import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IChat } from './chat.interface'
import { Chat } from './chat.model'
import { JwtPayload } from 'jsonwebtoken'
import { Message } from '../message/message.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'

const createChat = async (payload: IChat) => {
  const result = await Chat.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Chat')
  return result
}

const getAllChatsForUser = async (user: JwtPayload, requestId: string, paginationOptions: IPaginationOptions) => {
  const userId = user.authId!
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
  
  const [result, total] = await Promise.all([
    Chat.find({
      participants: { $in: [userId] },
      request: requestId,
    }).populate({
      path: 'participants',
      select: 'name profile',
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Chat.countDocuments({
      participants: { $in: [userId] },
      request: requestId,
    })
  ])

  const formattedResult = result.map(async (chat) => {
    const { participants, ...rest } = chat

    return {
      ...rest,
      participant: participants.find((participant) => participant._id != userId),
      unreadMessageCount: await Message.countDocuments({
        chat: chat._id,
        isRead: false,
        receiver: userId,
      })
    }
  })



  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: await Promise.all(formattedResult)
  }
}

const getAllChatForBusinesses = async (user: JwtPayload, paginationOptions: IPaginationOptions) => {
  const userId = user.authId!
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
  
  const [result, total] = await Promise.all([
    Chat.find({
      participants: { $in: [userId] },
    }).populate({
      path: 'participants',
      select: 'name profile',
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Chat.countDocuments({
      participants: { $in: [userId] },
    })
  ])

  const formattedResult = result.map(async (chat) => {
    const { participants, ...rest } = chat
    return {
      ...rest,
      participant: participants.find((participant) => participant._id != userId),
      unreadMessageCount: await Message.countDocuments({
        chat: chat._id,
        isRead: false,
        receiver: userId,
      })
    }
  })

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: await Promise.all(formattedResult)
  }
}

const getSingleChat = async (id: string) => {
  const result = await Chat.findById(id)
  return result
}

const updateChat = async (id: string, payload: Partial<IChat>) => {
  const result = await Chat.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  )
  return result
}

const deleteChat = async (id: string) => {
  const result = await Chat.findByIdAndDelete(id)
  return result
}

export const ChatServices = {
  createChat,
  getAllChatsForUser,
  getAllChatForBusinesses,
  getSingleChat,
  updateChat,
  deleteChat,
}
