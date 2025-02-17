import { Schema, model } from 'mongoose';
import { IUser, UserModel } from './user.interface'; 
import { USER_STATUS } from '../../../enum/user';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import bcrypt from 'bcrypt';

const userSchema = new Schema<IUser, UserModel>({
  name: {
    type: String,

  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  status: {
    type: String,
    enum: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED, USER_STATUS.DELETED],
    default: USER_STATUS.ACTIVE,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    select: false,
    required: true,
  },
  role: {
    type: String,
    default: 'user',
  },
  restrictionLeftAt: {
    type: Date,
  },  
  passwordChangedAt: {
    type: Date,
  },
  appId: {
    type: String,
  },
  deviceToken: {
    type: String,
  },
  wrongLoginAttempts: {
    type: Number,
    default: 0,
  },
  resetPassword: {
    type: Boolean,
    default: false,
  },

},{
  timestamps: true,
});

userSchema.statics.isPasswordMatched = async function(
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
}

userSchema.pre<IUser>('save', async function (next) {
  //find the user by email
  const isExist = await User.findOne({ email: this.email , status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } });
  if(isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'An account with this email already exists');
  }

  this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
  next();
})

export const User = model<IUser, UserModel>('User', userSchema);
