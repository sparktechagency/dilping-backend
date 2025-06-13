import { Schema, model } from 'mongoose'
import { IMessage, MessageModel } from './message.interface'

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    receiver: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    type: { type: String, enum: ['text', 'offer', 'image', 'both'] }, // Add the 'type' field with enum value
    offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
    images: { type: [String] },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const Message = model<IMessage, MessageModel>('Message', messageSchema)
