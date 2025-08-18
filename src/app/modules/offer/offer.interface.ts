import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IOffer = {
  _id: Types.ObjectId
  business: Types.ObjectId | IUser
  title: string
  description: string
  // discount: number
  default: boolean
  createdAt: Date
  expiresAt: Date
  updatedAt: Date
}

export type OfferModel = Model<IOffer>
