import { Model, Types } from 'mongoose'
import { IChat } from '../chat/chat.interface'
import { IUser } from '../user/user.interface'

export type IMessage = {
  _id: Types.ObjectId
  chat: Types.ObjectId | IChat
  request: Types.ObjectId
  sender: Types.ObjectId | IUser
  receiver: Types.ObjectId | IUser
  message?: string
  images?: string[]
  type: 'text' | 'image' | 'both' | 'offer'
  offerTitle?: string
  status: 'new' | 'ongoing' | 'completed'
  offerDescription?: string
  isRead?: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type MessageModel = Model<IMessage>
