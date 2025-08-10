import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IChat = {
  _id: Types.ObjectId
  requests: Types.ObjectId[]
  participants: Types.ObjectId[] | IUser[] // Array of user IDs
  latestMessage: string
  latestMessageTime: Date
  isEnabled: boolean
  isMessageEnabled: boolean
  distance: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type ChatModel = Model<IChat>
