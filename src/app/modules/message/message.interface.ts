import { Model, Types } from 'mongoose'
import { IChat } from '../chat/chat.interface'
import { IUser } from '../user/user.interface'

export type IMessage = {
  _id: Types.ObjectId
  chat: Types.ObjectId | IChat
  receiver: Types.ObjectId | IUser
  message?: string
  type: 'text' | 'image' | 'both'
  offer?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type MessageModel = Model<IMessage>
