import { Model, Types } from 'mongoose';
import { ICategory } from '../category/category.interface';
import { ISubcategory } from '../subcategory/subcategory.interface';
import { IUser } from '../user/user.interface';

export type ISupport = {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  prevCategory?: Types.ObjectId | ICategory;
  category?: Types.ObjectId | ICategory;
  prevSubcategories?: Types.ObjectId[] | ISubcategory[];
  subcategories?: Types.ObjectId[] | ISubcategory[];
  prevBusinessName?: string;
  businessName?: string;
  prevEiin?: string;
  types: string[];
  status: string;
  message?: string;
  eiin?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SupportModel = Model<ISupport>;
