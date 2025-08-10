import { Schema, model } from 'mongoose'
import { IMessage, MessageModel } from './message.interface'

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    request: { type: Schema.Types.ObjectId, ref: 'Request' },
    sender: { type: Schema.Types.ObjectId, ref: 'User' }, 
    receiver: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    type: { type: String, enum: ['text', 'offer', 'image', 'both'] },
    offerTitle: { type: String },
    status: { type: String, enum: ['new', 'ongoing', 'completed'], default: 'new' },
    offerDescription: { type: String },
    images: { type: [String] },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const Message = model<IMessage, MessageModel>('Message', messageSchema)
