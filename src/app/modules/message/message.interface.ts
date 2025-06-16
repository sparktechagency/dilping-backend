import { Model, Types } from 'mongoose'
import { IChat } from '../chat/chat.interface'
import { IUser } from '../user/user.interface'

export type IMessage = {
  _id: Types.ObjectId
  chat: Types.ObjectId | IChat
  receiver: Types.ObjectId | IUser
  message?: string
  images?: string[]
  type: 'text' | 'image' | 'both'
  offerTitle?: string
  offerDescription?: string
  isRead?: boolean
  createdAt: Date
  updatedAt: Date
}

export type MessageModel = Model<IMessage>
