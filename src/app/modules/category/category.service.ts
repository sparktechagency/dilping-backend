import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ICategory } from './category.interface'
import { Category } from './category.model'

const createCategory = async (payload: ICategory) => {
  const result = await Category.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Category')
  return result
}

const getAllCategories = async () => {
  const result = await Category.find()
  return result
}

const getSingleCategory = async (id: string) => {
  const result = await Category.findById(id)
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
  const result = await Category.findByIdAndDelete(id)
  return result
}

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
}
