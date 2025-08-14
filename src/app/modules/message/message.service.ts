import { IPaginationOptions } from "../../../interfaces/pagination"
import { Message } from "./message.model"
import { paginationHelper } from "../../../helpers/paginationHelper"
import { IMessage } from "./message.interface";
import { JwtPayload } from "jsonwebtoken";
import { Chat } from "../chat/chat.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { redisClient } from "../../../helpers/redis.client";
import { USER_ROLES } from "../../../enum/user";
import { sendDataWithSocket } from "../../../helpers/notificationHelper";

const getMessageByChat = async (chatId: string, requestId?: string, paginationOptions?: IPaginationOptions) => {
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions || {});
  
  // Build query - if requestId is provided, filter by it
  const query: any = { chat: chatId };
  if (requestId) {
    query.request = requestId;
  }

  const [result, total] = await Promise.all([
    Message.find(query).populate({
      path: 'sender',
      select: 'name profile address rating ratingCount email category',
    }).populate({
      path: 'receiver',
      select: 'name profile address rating ratingCount email category',
    }).populate({
      path: 'request',
      select: 'message category coordinates',
    })
    .sort({createdAt: 'desc'}).skip(skip).limit(limit).lean(),
    Message.countDocuments(query)
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


const sendMessage = async (user: JwtPayload, payload: IMessage) => {
  const sender = user.authId!
  const {chat, message, images, request} = payload

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Check if the requested user is the participant of the chat
    const chatExist = await Chat.findById(chat).populate({
      path: 'participants',
      select: 'name profile',
    }).lean()
    if(!chatExist){
      throw new ApiError(StatusCodes.NOT_FOUND, 'Sorry the chat you are trying to access does not exist.')
    }

    // Check if the sender is the participant of the chat
    if(!chatExist.participants.some((participant) => participant._id.toString() === sender)){
      throw new ApiError(StatusCodes.FORBIDDEN, 'Sorry you are not authorized to access this chat.')
    }

    // if(!chatExist.isMessageEnabled && user.role !== USER_ROLES.BUSINESS){
    //   throw new ApiError(StatusCodes.FORBIDDEN, 'Sorry the message is disabled for this chat.')
    // }

    // Validate that the request belongs to this chat
    if(request && !chatExist.requests.some((req: any) => req.toString() === request.toString())){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'The specified request does not belong to this chat.')
    }

    payload.receiver = chatExist.participants.find((participant) => participant._id.toString() !== sender)!

    // Decide the type of the message
    const type = payload.offerTitle
      ? 'offer'
      : payload.images && payload.message
      ? 'both'
      : payload.images
      ? 'image'
      : 'text'

    // Create the message with request linkage
    const [newMessage] = await Message.create([{
      chat,
      request: request || null,
      sender,
      receiver: payload.receiver,
      message,
      type,
      offerTitle: payload.offerTitle,
      offerDescription: payload.offerDescription,
      images,
      status: 'new', // Default status for new messages
    }], { session })

    const populatedMessage = await newMessage.populate([
      { path: 'sender', select: 'name profile address rating ratingCount' },
      { path: 'receiver', select: 'name profile address rating ratingCount' },
      { path: 'request', select: 'message category' },
    ]);

    sendDataWithSocket(`message`,chatExist.participants[1].toString(), populatedMessage)



    if(!newMessage){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create message')
    }

    // Update the chat
    await Chat.findByIdAndUpdate(chat, {
      latestMessage: type === 'offer' ? payload.offerTitle : payload.message,
      latestMessageTime: new Date(),
      isMessageEnabled: type === 'offer' ? false : true,
    }, { session })

   

    await session.commitTransaction()

    return newMessage

  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}


const enableChat = async (chatId: string) => {
  const chat = await Chat.findByIdAndUpdate(chatId, { isMessageEnabled: true })
  if (!chat) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Failed to enable chat.')
  }
    //del cache for chat


    //@ts-ignore
    const socket = global.io;
    socket.emit(`chatEnabled::${chat.participants[1].toString()}`, chat)
  return "Chat enabled successfully."
}


  
const updateMessageStatusByRequest = async (requestId: string, chatId: string, status: 'new' | 'ongoing' | 'completed') => {
  console.log(requestId, chatId, status)

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Update all messages linked to this request
    const result = await Message.updateMany(
      { request: requestId, chat: chatId },
      { status },
      { session }
    )



    await session.commitTransaction()
    return result

  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}

export const MessageServices = {

  getMessageByChat,
  sendMessage,
  enableChat,
  updateMessageStatusByRequest,
}
