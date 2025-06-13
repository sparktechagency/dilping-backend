import { Schema, model } from 'mongoose'
import { IUser, UserModel } from './user.interface'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import config from '../../../config'
import bcrypt from 'bcrypt'
import { redisClient } from '../../../helpers/redis.client'

const userSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    eiin: {
      type: String,
    },
    license: {
      type: String,
    },
    businessName: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: Number,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: [0.0, 0.0], // [longitude, latitude]
      },
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
    profile: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    h3Index: {
      type: String,
      default: null,  
    },
    h3Res: {
      type: Number,
      default: 9,
    },
    role: {
      type: String,
      default: USER_ROLES.USER,
    },
    appId: {
      type: String,
    },
    deviceToken: {
      type: String,
    },
    authentication: {
      _id: false,
      select: false,
      type: {
        restrictionLeftAt: {
          type: Date,
          default: null,
        },
        resetPassword: {
          type: Boolean,
          default: false,
        },
        wrongLoginAttempts: {
          type: Number,
          default: 0,
        },
        passwordChangedAt: {
          type: Date,
          default: null,
        },
        oneTimeCode: {
          type: String,
          default: null,
        },
        latestRequestAt: {
          type: Date,
          default: null,
        },
        expiresAt: {
          type: Date,
          default: null,
        },
        requestCount: {
          type: Number,
          default: 0,
        },
        authType: {
          type: String,
          default: null,
        },
      },
    },
  },
  {
    timestamps: true,
  },
)

userSchema.index({ location: '2dsphere' })
userSchema.index({ h3Index: 1 })

userSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword)
}

// Update H3 index when location changes

// Invalidate cache when business location changes
const invalidateCache = async function (business: any) {
  if (business.role !== USER_ROLES.BUSINESS) return

  const oldHex = business.previous('h3Index')
  const newHex = business.h3Index

  const hexesToInvalidate = new Set()
  if (oldHex) hexesToInvalidate.add(oldHex)
  if (newHex) hexesToInvalidate.add(newHex)

  // Delete all cache keys related to these hexes
  await Promise.all(
    Array.from(hexesToInvalidate).map(hex =>
      redisClient.del(`business:hex:${hex}`),
    ),
  )
}

userSchema.pre<IUser>('save', async function (next) {
  //find the user by email
  const isExist = await User.findOne({
    email: this.email,
    status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
  })
  if (isExist) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'An account with this email already exists',
    )
  }

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  )
  next()
})

export const User = model<IUser, UserModel>('User', userSchema)
