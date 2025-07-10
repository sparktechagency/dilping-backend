import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISupport } from './support.interface';
import { Support } from './support.model';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enum/user';
import { User } from '../user/user.model';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import mongoose from 'mongoose';
import { sendDataWithSocket, sendNotification } from '../../../helpers/notificationHelper';
import { IUser } from '../user/user.interface';
import { ICategory } from '../category/category.interface';
import { ISubcategory } from '../subcategory/subcategory.interface';

const createSupport = async (user: JwtPayload, payload: ISupport) => {

  const isUserExist = await User.findById(user.authId)
  if (!isUserExist)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to get your profile information please try again later.',
    );
  
  payload.category = payload.category ?? isUserExist.category;
  payload.subcategories = payload.subcategories ?? isUserExist.subCategories;
  payload.businessName = payload.businessName ?? isUserExist.businessName;
  payload.eiin = payload.eiin ?? isUserExist.eiin;
  
  const type: ISupport['types'] = [];
  if (payload.category) type.push('category');
  if (payload.subcategories?.length) type.push('subcategories');
  if (payload.businessName) type.push('businessName');
  if (payload.eiin) type.push('eiin');
  if (!type.length) type.push('others');
  payload.types = type;
  
  const result = await Support.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Support',
    );
  return result;
};

const getAllSupports = async (user: JwtPayload,filter:string,paginationOptions: IPaginationOptions) => {
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
  const query = user.role === USER_ROLES.USER ? { user: user.authId } : {types: {$in: [filter]}}
  const [result, total] = await Promise.all([Support.find(query).populate('user').populate('category').populate('subcategories').sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),Support.countDocuments(query)]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: result
  };
};

const getSingleSupport = async (id: string, user: JwtPayload) => {
  const query = user.role === USER_ROLES.USER ? { user: user.authId } : {}
  const result = await Support.findById({ _id: id, ...query }).populate('user').populate('category').populate('subcategories').lean();
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'The support request you are looking for does not exist',
    );
  return result ;
};

const updateSupport = async (
  user: JwtPayload,
  id: string,
  payload: Partial<ISupport>,
) => {


  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isSupportExist = await Support.findById(id,{session}).populate<{user: IUser}>('user')
    if (!isSupportExist)
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The support request you are looking for does not exist',
      );
  
      const updatetableData = { 
        ...(isSupportExist.types.includes('category') && { category: isSupportExist.category }),
        ...(isSupportExist.types.includes('subcategories') && { subcategories: isSupportExist.subcategories }),
        ...(isSupportExist.types.includes('businessName') && { businessName: isSupportExist.businessName }),
        ...(isSupportExist.types.includes('eiin') && { eiin: isSupportExist.eiin }),
      }
    if(payload.status === 'approved'){
      const updateUser = await User.findByIdAndUpdate(isSupportExist.user, { $set: updatetableData }, { new: true });
      if (!updateUser)
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Failed to update user information',
        );
    }
    const result = await Support.findByIdAndUpdate(
      id,
      { $set: {status: payload.status} },
      {
        new: true,
        session
      },
    ).populate<{user: IUser}>('user').populate<{category: ICategory}>('category').populate<{subcategories: ISubcategory}>('subcategories').lean();

    //send notification to user
    const notificationData = {
      sender: user.authId!,
      receiver: isSupportExist.user.toString(),
      title: payload.status === 'approved' && !isSupportExist.types.includes('others') ? `Hello ${isSupportExist.user.name} your request has been approved` : payload.status === 'approved' && isSupportExist.types.includes('others') ? `Hello ${isSupportExist.user.name} your support request has been approved` : `Hello ${isSupportExist.user.name} your support request has been rejected`,
      body: payload.status === 'approved' && !isSupportExist.types.includes('others') ? `Admin has approved the request to update your profile with ${isSupportExist.types.join(', ')}` : payload.status === 'approved' && isSupportExist.types.includes('others') ? `Admin has approved your support request` : `Admin has rejected your support request, ${payload.message}`,
    }
    await sendNotification(notificationData);
    sendDataWithSocket('support', isSupportExist.user.toString(), result)
    await session.commitTransaction();
    await session.endSession();
    return payload.status === 'approved' ? 'Support request approved successfully' : 'Support request rejected successfully';
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to update support request',
    ); 
  }finally{
    session.endSession();
  }
 
};

const deleteSupport = async (id: string) => {
  const result = await Support.findByIdAndDelete(id);
  return result;
};

export const SupportServices = {
  createSupport,
  getAllSupports,
  getSingleSupport,
  updateSupport,
  deleteSupport,
};
