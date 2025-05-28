import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ICategory } from './category.interface'
import { Category } from './category.model'
import mongoose, { Types } from 'mongoose'
import { Subcategory } from '../subcategory/subcategory.model'
import { REDIS_KEYS } from '../../../enum/redis'
import { redisClient } from '../../../helpers/redis.client'

const createCategory = async (payload: ICategory) => {
  const result = await Category.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Category')

  await redisClient.del(REDIS_KEYS.CATEGORIES)
  return result
}

const getAllCategories = async () => {
  const cacheKey = REDIS_KEYS.CATEGORIES

  const cachedResult = await redisClient.get(cacheKey)

  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  const result = await Category.find()
    .populate({
      path: 'subCategories',
      select: {
        _id: 1,
        title: 1,
      },
    })
    .lean()

  await redisClient.setEx(cacheKey, 86400, JSON.stringify(result))
  return result
}

const getSingleCategory = async (id: string) => {
  const cacheKey = REDIS_KEYS.CATEGORIES

  try {
    const cachedCategories = await redisClient.get(cacheKey)

    if (cachedCategories) {
      const categories = JSON.parse(cachedCategories)

      const category = categories.find(
        (cat: any) =>
          cat._id === id || cat._id === new Types.ObjectId(id).toString(),
      )

      if (category) {
        return category
      }
    }

    return await getSingleCategoryFromDB(id)
  } catch (error) {
    return await getSingleCategoryFromDB(id)
  }
}

const getSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findById(id)
    .populate({
      path: 'subCategories',
      select: '_id title',
    })
    .lean()
  return result
}

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const result = await Category.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  )
  await redisClient.del(REDIS_KEYS.CATEGORIES)
  return result
}

const deleteCategory = async (id: string) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const result = await Category.findByIdAndDelete(id, { session })
    if (!result)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Category')

    // Delete all subcategories associated with the category
    await Subcategory.deleteMany(
      { _id: { $in: result.subCategories } },
      { session },
    )

    await session.commitTransaction()
    await session.endSession()
    return 'Category deleted successfully.'
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    await redisClient.del(REDIS_KEYS.CATEGORIES)
    await session.endSession()
  }
}

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
}
