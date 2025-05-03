import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISubcategory } from './subcategory.interface';
import { Subcategory } from './subcategory.model';

const createSubcategory = async (payload: ISubcategory) => {
  const result = await Subcategory.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Subcategory',
    );
  return result;
};

const getAllSubcategorys = async () => {
  const result = await Subcategory.find();
  return result;
};

const getSingleSubcategory = async (id: string) => {
  const result = await Subcategory.findById(id);
  return result;
};

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
  );
  return result;
};

const deleteSubcategory = async (id: string) => {
  const result = await Subcategory.findByIdAndDelete(id);
  return result;
};

export const SubcategoryServices = {
  createSubcategory,
  getAllSubcategorys,
  getSingleSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
