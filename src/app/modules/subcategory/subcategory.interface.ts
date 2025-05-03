import { Model, Types } from 'mongoose';

export type ISubcategory = {
  _id: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SubcategoryModel = Model<ISubcategory>;
