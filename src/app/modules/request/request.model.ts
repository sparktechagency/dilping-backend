import { Schema, model } from 'mongoose'
import { IRequest, RequestModel } from './request.interface'

const requestSchema = new Schema<IRequest, RequestModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    radius: { type: Number },
    coordinates: { type: [Number] },
  },
  {
    timestamps: true,
  },
)

export const Request = model<IRequest, RequestModel>('Request', requestSchema)
