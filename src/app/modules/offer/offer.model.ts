import { Schema, model } from 'mongoose'
import { IOffer, OfferModel } from './offer.interface'

const offerSchema = new Schema<IOffer, OfferModel>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    // discount: { type: Number, required: true },
    default: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true,
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
)

export const Offer = model<IOffer, OfferModel>('Offer', offerSchema)
