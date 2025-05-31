import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IRequest = {
  _id: Types.ObjectId
  user: Types.ObjectId | IUser
  coordinates: [number, number]
  radius: number
  message: string
  createdAt: Date
  updatedAt: Date
}

export type RequestModel = Model<IRequest>
