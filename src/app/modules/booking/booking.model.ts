import { Schema, model } from 'mongoose';
import { IBooking, BookingModel } from './booking.interface'; 

const bookingSchema = new Schema<IBooking, BookingModel>({
  offerTitle: { type: String },
  offerDescription: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  subCategories: { type: [Schema.Types.ObjectId], ref: 'Subcategory' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  request: { type: Schema.Types.ObjectId, ref: 'Request' }, 
  business: { type: Schema.Types.ObjectId, ref: 'User' },
  code: { type: String },
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
}, {
  timestamps: true
});

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema);
