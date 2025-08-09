import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'
import { ICategory } from '../category/category.interface'
import { ISubcategory } from '../subcategory/subcategory.interface'

export type IRequest = {
  _id: Types.ObjectId
  user: Types.ObjectId | IUser
  category: Types.ObjectId | ICategory
  subCategories: Types.ObjectId[] | ISubcategory[]
  coordinates: [number, number]
  businesses: Types.ObjectId[]
  radius: number
  h3Index: string
  message: string
  createdAt: Date
  updatedAt: Date
}

export type RequestModel = Model<IRequest>


export type IRequestFilters = {
  searchTerm?: string
  category?: string
  subCategory?: string
}