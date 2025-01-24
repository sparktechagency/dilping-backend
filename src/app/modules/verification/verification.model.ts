import { Schema, model } from 'mongoose';
import { IVerification, VerificationModel } from './verification.interface'; 

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
  passwordChangedAt: { 
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
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

verificationSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone is required'));
  }
  next();
});

export const Verification = model<IVerification, VerificationModel>('Verification', verificationSchema);
