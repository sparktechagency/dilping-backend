import { Model, Types } from 'mongoose'
import { ICategory } from '../category/category.interface'
import { ISubcategory } from '../subcategory/subcategory.interface'

type IAuthentication = {
  restrictionLeftAt: Date | null
  resetPassword: boolean
  wrongLoginAttempts: number
  passwordChangedAt?: Date
  oneTimeCode: string
  latestRequestAt: Date
  expiresAt?: Date
  requestCount?: number
  authType?: 'createAccount' | 'resetPassword'
}

export type Point = {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export type IUser = {
  _id: Types.ObjectId
  name?: string
  lastName?: string
  email?: string
  profile?: string
  phone?: string
  businessName?: string
  category?: Types.ObjectId | ICategory
  subCategories?: Types.ObjectId[] | ISubcategory[]
  eiin?: string
  rating?: number
  ratingCount?: number
  license?: string
  address?: string
  city?: string
  zipCode: number
  location: Point
  status: string
  verified: boolean
  reportCount?: number
  password: string
  h3Index?: string
  h3Res?: string
  role: string
  appId?: string
  deviceToken?: string
  authentication: IAuthentication
  createdAt: Date
  updatedAt: Date
}

export type UserModel = {
  isPasswordMatched: (
    givenPassword: string,
    savedPassword: string,
  ) => Promise<boolean>
} & Model<IUser>
