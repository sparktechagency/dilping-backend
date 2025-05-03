import { Schema, model } from 'mongoose'
import { ICategory, CategoryModel } from './category.interface'

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    title: { type: String },
    icon: { type: String },
    subCategories: { type: [Schema.Types.ObjectId], ref: 'Subcategory' },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export const Category = model<ICategory, CategoryModel>(
  'Category',
  categorySchema,
)
