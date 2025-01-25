import { Model, Types } from 'mongoose';

export type IVerification = {
  _id: Types.ObjectId;
  email?: string;
  phone?: string;
  oneTimeCode: string;
  createdAt: Date;
  expiresAt: Date;
  requestCount: number;
  latestRequestAt: Date;
  resetPassword: boolean;
  restrictionLeft?: Date | null;
  type: 'createAccount' | 'resetPassword';
};

export type VerificationModel = Model<IVerification>;
