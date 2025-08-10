import { Schema, model } from 'mongoose'
import { IChat, ChatModel } from './chat.interface'

const chatSchema = new Schema<IChat, ChatModel>(
  {
    requests: { type: [Schema.Types.ObjectId], ref: 'Request', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User'  }],
    latestMessage: { type: String, default: '' },
    latestMessageTime: { type: Date, default: Date.now },
    isEnabled: { type: Boolean, default: false },
    isMessageEnabled: { type: Boolean, default: false },
    distance: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const Chat = model<IChat, ChatModel>('Chat', chatSchema)
