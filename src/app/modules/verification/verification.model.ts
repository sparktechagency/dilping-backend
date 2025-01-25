import { Schema, model } from 'mongoose';
import { IVerification, VerificationModel } from './verification.interface'; 
import bcrypt from 'bcrypt';
import config from '../../../config';
const verificationSchema = new Schema<IVerification, VerificationModel>({
  phone: { 
    type: String,
  },
  email: { 
    type: String,
     },
  oneTimeCode: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: { 
    type: Date,
    required: true
  },
  requestCount: { 
    type: Number,
    default: 1
  },
  latestRequestAt: { 
    type: Date,
    default: Date.now
  },
  resetPassword: { 
    type: Boolean,
    default: false
  },
  restrictionLeft: { 
    type: Date 
  },
  type: { 
    type: String,
    enum: ['createAccount', 'resetPassword'],
    required: true
  }
});

verificationSchema.index({ email: 1 });
verificationSchema.index({ phone: 1 });
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 }); // TTL index for 1.3 hours

verificationSchema.pre('save',async function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone is required'));
  }
  if (this.isModified('oneTimeCode')) {
    this.oneTimeCode = await bcrypt.hash(this.oneTimeCode, Number(config.bcrypt_salt_rounds));
  }
  next();
});

export const Verification = model<IVerification, VerificationModel>('Verification', verificationSchema);
