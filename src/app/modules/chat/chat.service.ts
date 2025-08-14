import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IChat } from './chat.interface'
import { Chat } from './chat.model'
import { JwtPayload } from 'jsonwebtoken'
import { Message } from '../message/message.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { redisClient } from '../../../helpers/redis.client'

const createChat = async (payload: IChat) => {
  const result = await Chat.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Chat')
  return result
}

const getAllChatsForUser = async (user: JwtPayload, requestId: string, paginationOptions: IPaginationOptions) => {
  const userId = user.authId!
  const { sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);


 console.log('requestId',requestId,userId)


  // Find chats that contain the specific request
  const [result, total] = await Promise.all([
    Chat.find({
      participants: { $in: [userId] },
      requests: { $in: [requestId] },
    }).populate({
      path: 'participants',
      select: 'name profile businessName'
    }).sort({[sortBy]: sortOrder}).lean(),
    Chat.countDocuments({
      participants: { $in: [userId] },
      requests: { $in: [requestId] },
    })
  ])

  // Mark messages related to this request as read
  await Message.updateMany({
    chat: { $in: result.map((chat) => chat._id) },
    request: requestId,
    isRead: false,
    receiver: userId,
  }, { isRead: true })
  
  const formattedResultPromise = result.map(async (chat) => {
    const { participants, ...rest } = chat
    
    return {
      ...rest,
      participant: participants.find((participant) => participant._id != userId),
      unreadMessageCount: await Message.countDocuments({
        chat: chat._id,
        request: requestId,
        isRead: false,
        receiver: userId,
      }),
      // // Get latest message for this specific request
      // latestRequestMessage: await Message.findOne({
      //   chat: chat._id,
      //   request: requestId
      // }).sort({ createdAt: -1 }).select('message createdAt type')
    }
  })

  const formattedResult = await Promise.all(formattedResultPromise)



  return formattedResult
}

const getAllChatForBusinesses = async (user: JwtPayload,status:'new' | 'ongoing' | 'completed', paginationOptions: IPaginationOptions) => {
  const userId = user.authId!
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);


  // Find chats that have messages with the specified status
  const chatsWithStatus = await Message.distinct('chat', {
    status: status,
    $or: [{sender: userId}, {receiver: userId}]
  });


  const [result, total] = await Promise.all([
    Chat.find({
      _id: { $in: chatsWithStatus },
      participants: { $in: [userId] },
    }).populate({
      path: 'participants',
      select: 'name profile businessName'
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Chat.countDocuments({
      _id: { $in: chatsWithStatus },
      participants: { $in: [userId] },
    })
  ])

  await Message.updateMany({
    chat: { $in: result.map((chat) => chat._id) },
    isRead: false,
    receiver: userId,
  }, { isRead: true })

  const formattedResultPromise = result.map(async (chat) => {
    const { participants, ...rest } = chat
    
    // Get the latest message with the specified status for this chat
    const latestStatusMessage = await Message.findOne({
      chat: chat._id,
      status: status
    }).sort({ createdAt: -1 }).select('message createdAt type request');

    return {
      ...rest,
      participant: participants.find((participant) => participant._id != userId),
      unreadMessageCount: await Message.countDocuments({
        chat: chat._id,
        isRead: false,
        receiver: userId,
      }),
      latestStatusMessage,
      // Count of messages with this status in the chat
      statusMessageCount: await Message.countDocuments({
        chat: chat._id,
        status: status
      })
    }
  })
  
  const formattedResult = await Promise.all(formattedResultPromise)

 
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: formattedResult
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
