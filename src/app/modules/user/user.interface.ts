import { Model, Types } from 'mongoose';

type IAuthentication = {
  token: string;
  passwordChangedAt: Date;
  isResetpassword: boolean;
  otp: number;
  expireAt: Date;
};

export type IUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profile?: string;
  contact: string;
  status: string;
  verified: boolean;
  address?: string;
  password: string;
  role: string;
  restrictionLeft?: Date;
  appId?: string;
  authentication: IAuthentication;
  createdAt: Date;
  updatedAt: Date;
};


export type UserModel ={
  isPasswordMatched: (
    givenPassword: string,
    savedPassword: string,
  ) => Promise<boolean>;
} & Model<IUser>;
