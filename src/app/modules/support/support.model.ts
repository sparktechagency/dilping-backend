import { Schema, model } from 'mongoose';
import { ISupport, SupportModel } from './support.interface'; 

const supportSchema = new Schema<ISupport, SupportModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, populate: { path: 'user', select: 'name profile category subcategories businessName eiin' } },
  prevCategory: { type: Schema.Types.ObjectId, ref: 'Category', populate: { path: 'category', select: 'title' } },
  category: { type: Schema.Types.ObjectId, ref: 'Category', populate: { path: 'category', select: 'title' } },
  prevSubcategories: { type: [Schema.Types.ObjectId], ref: 'Subcategory', populate: { path: 'subcategories', select: 'title' } },
  subcategories: { type: [Schema.Types.ObjectId], ref: 'Subcategory', populate: { path: 'subcategories', select: 'title' } },
  prevBusinessName: { type: String },
  businessName: { type: String, required: false },
  prevEiin: { type: String },
  message: { type: String },
  eiin: { type: String, required: false },
  types: { type: [String], enum: ['category', 'businessName', 'eiin', 'subcategories', 'others'], default: ['others'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
  timestamps: true
});

export const Support = model<ISupport, SupportModel>('Support', supportSchema);
