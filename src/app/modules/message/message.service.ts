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

const getMessageByChat = async (chatId: string, paginationOptions: IPaginationOptions) => {
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
  const [result, total] = await Promise.all([
    Message.find({ chat: chatId }).populate({
      path: 'offer',
      select: 'title description _id discount ',
      populate: {
        path: 'business',
        select: 'name profile',
      }
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

  let offerExist: IOffer | null = null
  if(payload.offer){
     offerExist = await Offer.findById(payload.offer).lean()
    if(!offerExist){
      throw new ApiError(StatusCodes.NOT_FOUND, 'Sorry the offer you are trying to access does not exist.')
    }
  }

  //decide the type of the message whether the message contains only text or offer or image or both (text and image)
  const type = payload.offer ? 'offer' : payload.images ? 'image' : payload.images && payload.message ? 'both' : 'text'

  
  //create the message
  const newMessage = await Message.create({
    chat,
    receiver: chatExist.participants.find((participant) => participant._id.toString() !== sender)!,
    message,
    type,
    offer: offerExist?._id,
    images,
  }, { session })

  if(!newMessage){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create message')
  }

  //update the chat
  await Chat.findByIdAndUpdate(chat, {
    latestMessage: type === 'offer' ? offerExist?.title : payload.message,
    lastMessageTime: new Date(),
  }, { session })

  await session.commitTransaction()
  await session.endSession()

  //return the message
  return newMessage

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
}
