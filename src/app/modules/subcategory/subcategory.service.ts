import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ISubcategory } from './subcategory.interface'
import { Subcategory } from './subcategory.model'
import mongoose from 'mongoose'
import { Category } from '../category/category.model'

const createSubcategory = async (payload: any) => {
  const subCategories = payload.subCategories.map((subcategory: string) => {
    return {
      title: subcategory,
    }
  })

  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const result = await Subcategory.create(subCategories, { session })
    if (!result)
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create subcategories',
      )

    //now push the subcategories into the category
    const category = await Category.findByIdAndUpdate(
      payload.category,
      {
        $push: {
          subCategories: result.map((subcategory: any) => subcategory._id),
        },
      },
      {
        new: true,
      },
    ).session(session)

    await session.commitTransaction()
    await session.endSession()
    return 'Sub category created successfully.'
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create subcategories',
    )
  } finally {
    await session.endSession()
  }
}

const getAllSubcategories = async () => {
  const result = await Subcategory.find()
  return result
}

const getSingleSubcategory = async (id: string) => {
  const result = await Subcategory.findById(id)
  return result
}

const updateSubcategory = async (
  id: string,
  payload: Partial<ISubcategory>,
) => {
  const result = await Subcategory.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  )
  return result
}

const deleteSubcategory = async (id: string) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const subcategory = await Subcategory.findByIdAndDelete(id, { session })
    console.log(subcategory)
    if (!subcategory)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Subcategory not found')
    //now pull the subcategory from the category
    const category = await Category.findOneAndUpdate(
      { subCategories: { $in: [subcategory._id] } },
      {
        $pull: {
          subCategories: subcategory._id,
        },
      },
    ).session(session)

    await session.commitTransaction()
    await session.endSession()
    return 'Subcategory deleted successfully.'
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete subcategory')
  } finally {
    await session.endSession()
  }
}

export const SubcategoryServices = {
  createSubcategory,
  getAllSubcategories,
  getSingleSubcategory,
  updateSubcategory,
  deleteSubcategory,
}
