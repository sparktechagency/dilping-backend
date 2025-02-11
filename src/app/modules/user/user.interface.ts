import { Model, Types } from 'mongoose';


export type IUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profile?: string;
  phone: string;
  status: string;
  verified: boolean;
  address?: string;
  password: string;
  role: string;
  appId?: string;
  
  createdAt: Date;
  updatedAt: Date;
};


export type UserModel ={
  isPasswordMatched: (
    givenPassword: string,
    savedPassword: string,
  ) => Promise<boolean>;
} & Model<IUser>;
