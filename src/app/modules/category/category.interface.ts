import { Model, Types } from 'mongoose'

export type ICategory = {
  title: string
  icon: string
  subCategories: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export type CategoryModel = Model<ICategory>
