import { Schema, model } from 'mongoose'
import { ISubcategory, SubcategoryModel } from './subcategory.interface'

const subcategorySchema = new Schema<ISubcategory, SubcategoryModel>(
  {
    title: { type: String },
  },
  {
    timestamps: true,
  },
)

export const Subcategory = model<ISubcategory, SubcategoryModel>(
  'Subcategory',
  subcategorySchema,
)
