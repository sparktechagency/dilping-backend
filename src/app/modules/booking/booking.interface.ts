import { Model, Types } from 'mongoose';
import { IOffer } from '../offer/offer.interface';
import { IUser } from '../user/user.interface';
import { IRequest } from '../request/request.interface';
import { ICategory } from '../category/category.interface';
import { ISubcategory } from '../subcategory/subcategory.interface';
import { IChat } from '../chat/chat.interface';

export type IBooking = {
  _id: Types.ObjectId;
  offerTitle: string;
  offerDescription: string;
  category: Types.ObjectId | ICategory;
  subCategories: Types.ObjectId[] | ISubcategory[];
  user: Types.ObjectId | IUser;
  business: Types.ObjectId | IUser;
  request: Types.ObjectId | IRequest;
  chat: Types.ObjectId | IChat;
  code: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingModel = Model<IBooking>;
