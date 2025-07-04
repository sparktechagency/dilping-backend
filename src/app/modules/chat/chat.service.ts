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

  const cacheKey = `chat:user-${userId}:${requestId}`;
  
  const cachedData = await redisClient.get(cacheKey);

  if(cachedData){
    return JSON.parse(cachedData)
  }

  const [result, total] = await Promise.all([
    Chat.find({
      participants: { $in: [userId] },
      request: requestId,
    }).populate({
      path: 'participants',
      select: 'name profile',
    }).sort({[sortBy]: sortOrder}).lean(),
    Chat.countDocuments({
      participants: { $in: [userId] },
      request: requestId,
    })
  
  ])

  //mark all the messages as read
  await Message.updateMany({
    chat: { $in: result.map((chat) => chat._id) },
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
        isRead: false,
        receiver: userId,
      })
    }
  })

  const formattedResult = await Promise.all(formattedResultPromise)

  await redisClient.set(cacheKey, JSON.stringify(formattedResult), 'EX', 60 * 15)


  return formattedResult
}

const getAllChatForBusinesses = async (user: JwtPayload,status:'new' | 'ongoing' | 'completed', paginationOptions: IPaginationOptions) => {
  const userId = user.authId!
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);

  
  const cacheKey = `chat:user:${status}-${userId}-${page}`;
  
  const cachedData = await redisClient.get(cacheKey);

  if(cachedData){
    return JSON.parse(cachedData)
  }

  const [result, total] = await Promise.all([
    Chat.find({
      participants: { $in: [userId] },
      status,
    }).populate({
      path: 'participants',
      select: 'name profile',
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Chat.countDocuments({
      participants: { $in: [userId] },
      status,
    })
  ])
  await Message.updateMany({
    chat: { $in: result.map((chat) => chat._id) },
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
        isRead: false,
        receiver: userId,
      })
    }
  })
  const formattedResult = await Promise.all(formattedResultPromise)

  if(formattedResult.length > 0){

    await redisClient.set(cacheKey, JSON.stringify({
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: formattedResult
    }), 'EX', 60 * 15)
  }



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
