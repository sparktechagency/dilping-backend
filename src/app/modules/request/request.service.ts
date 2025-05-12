import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IRequest } from './request.interface';
import { Request } from './request.model';

const createRequest = async (payload: IRequest) => {
  const result = await Request.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create Request',
    );
  return result;
};

const getAllRequests = async () => {
  const result = await Request.find();
  return result;
};

const getSingleRequest = async (id: string) => {
  const result = await Request.findById(id);
  return result;
};

const updateRequest = async (
  id: string,
  payload: Partial<IRequest>,
) => {
  const result = await Request.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  );
  return result;
};

const deleteRequest = async (id: string) => {
  const result = await Request.findByIdAndDelete(id);
  return result;
};

export const RequestServices = {
  createRequest,
  getAllRequests,
  getSingleRequest,
  updateRequest,
  deleteRequest,
};
