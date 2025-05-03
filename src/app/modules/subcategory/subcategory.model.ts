import { Schema, model } from 'mongoose'
import { ISubcategory, SubcategoryModel } from './subcategory.interface'

const subcategorySchema = new Schema<ISubcategory, SubcategoryModel>(
  {
    title: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export const Subcategory = model<ISubcategory, SubcategoryModel>(
  'Subcategory',
  subcategorySchema,
)
