import { Schema, model } from 'mongoose';
import { IBooking, BookingModel } from './booking.interface'; 

const bookingSchema = new Schema<IBooking, BookingModel>({
  offerTitle: { type: String },
  offerDescription: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  subCategories: { type: [Schema.Types.ObjectId], ref: 'Subcategory' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  request: { type: Schema.Types.ObjectId, ref: 'Request', required: true }, 
  chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
  business: { type: Schema.Types.ObjectId, ref: 'User', required: true, populate: { path: 'business', select: 'name profile businessName address rating location ratingCount' } },
  code: { type: String, required: true,default: () => `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`},
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
}, {
  timestamps: true
});

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema);
