import { IPaginationOptions } from "../../../interfaces/pagination"
import { Message } from "./message.model"
import { paginationHelper } from "../../../helpers/paginationHelper"
import { IMessage } from "./message.interface";
import { JwtPayload } from "jsonwebtoken";
import { Chat } from "../chat/chat.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Offer } from "../offer/offer.model";
import { IOffer } from "../offer/offer.interface";
import { socket } from "../../../utils/socket";

const getMessageByChat = async (chatId: string, paginationOptions: IPaginationOptions) => {
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
  const [result, total] = await Promise.all([
    Message.find({ chat: chatId }).populate({
      path: 'sender',
      select: 'name profile address',

    }).populate({
      path: 'receiver',
      select: 'name profile address',
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Message.countDocuments({ chat: chatId })
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
  const {chat, message, images} = payload

 
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
   
  //check if the requested user is the participant of the chat
  const chatExist = await Chat.findById(chat).populate({
    path: 'participants',
    select: 'name profile',
  }).lean()
  if(!chatExist){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sorry the chat you are trying to access does not exist.')
  }



  //check if the sender is the participant of the chat
  if(!chatExist.participants.some((participant) => participant._id.toString() === sender)){
    throw new ApiError(StatusCodes.FORBIDDEN, 'Sorry you are not authorized to access this chat.')
  }

  if(!chatExist.isMessageEnabled || !chatExist.isEnabled){
    throw new ApiError(StatusCodes.FORBIDDEN, 'Sorry the message is disabled for this chat.')
  }

  payload.receiver = chatExist.participants.find((participant) => participant._id.toString() !== sender)!

  //decide the type of the message whether the message contains only text or offer or image or both (text and image)
  const type = payload.offerTitle
  ? 'offer'
  : payload.images && payload.message
  ? 'both'
  : payload.images
  ? 'image'
  : 'text'



  //create the message
  const [newMessage] = await Message.create([{
    chat,
    sender,
    receiver: payload.receiver,
    message,
    type,
    offerTitle: payload.offerTitle,
    offerDescription: payload.offerDescription,
    images,
  }], { session })


  const populatedMessage = await newMessage.populate([
    { path: 'sender', select: 'name profile address' },
    { path: 'receiver', select: 'name profile address' },
  ]);

        //@ts-ignore
        const socket = global.io;
  socket.emit(`message::${chat}`, populatedMessage)

  if(!newMessage){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create message')
  }

  //update the chat
  await Chat.findByIdAndUpdate(chat, {
    latestMessage: type === 'offer' ? payload.offerTitle : payload.message,
    lastMessageTime: new Date(),
    isMessageEnabled: type === 'offer' ? false : true,
  }, { session })

  await session.commitTransaction()


  //return the message
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
}


  
export const MessageServices = {
  getMessageByChat,
  sendMessage,
  enableChat,
}
