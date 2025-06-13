import { Schema, model } from 'mongoose'
import { IRequest, RequestModel } from './request.interface'

const requestSchema = new Schema<IRequest, RequestModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: 'Subcategory', required: true },
    message: { type: String, required: true },
    h3Index: { type: String },
    radius: { type: Number, required: true },
    coordinates: { type: [Number], required: true },

  },
  {
    timestamps: true,
  },
)

export const Request = model<IRequest, RequestModel>('Request', requestSchema)
