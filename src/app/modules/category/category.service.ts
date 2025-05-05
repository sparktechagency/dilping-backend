import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ICategory } from './category.interface'
import { Category } from './category.model'
import mongoose from 'mongoose'
import { Subcategory } from '../subcategory/subcategory.model'

const createCategory = async (payload: ICategory) => {
  const result = await Category.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Category')
  return result
}

const getAllCategories = async () => {
  const result = await Category.find()
    .populate({
      path: 'subCategories',
      select: {
        _id: 1,
        title: 1,
      },
    })
    .lean()
  return result
}

const getSingleCategory = async (id: string) => {
  const result = await Category.findById(id)
    .populate({
      path: 'subCategories',
      select: {
        _id: 1,
        title: 1,
      },
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
