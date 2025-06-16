import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { ISubcategory } from './subcategory.interface'
import { Subcategory } from './subcategory.model'
import mongoose, { Types } from 'mongoose'
import { Category } from '../category/category.model'
import { redisClient } from '../../../helpers/redis.client'
import { REDIS_KEYS } from '../../../enum/redis'

const createSubcategory = async (payload: any) => {
  const subCategories = payload.subCategories.map((subcategory: string) => ({
    title: subcategory,
  }));
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const result = await Subcategory.insertMany(subCategories,{session});
    if (!result.length ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create subcategories');
    }

    const subcategoryIds = result.map((subcategory: any) => subcategory._id);

    const category = await Category.findByIdAndUpdate(
      new Types.ObjectId(payload.category),
      {
        $push: { subCategories: subcategoryIds },
      },
      {
        new: true,
        session,
      }
    );

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    await session.commitTransaction();
    await redisClient.del(REDIS_KEYS.CATEGORIES)
    return 'Sub category created successfully.';
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating subcategories:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Something went wrong, please try again.');
  } finally {
    await session.endSession();
  }
};

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
  await redisClient.del(REDIS_KEYS.CATEGORIES)

  return result
}

const deleteSubcategory = async (id: string) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()
    const subcategory = await Subcategory.findByIdAndDelete(id, { session })
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
   await redisClient.del(REDIS_KEYS.CATEGORIES)
 
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
