import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IBooking } from './booking.interface';
import { Booking } from './booking.model';
import { JwtPayload } from 'jsonwebtoken';

const createBooking = async (user: JwtPayload, payload: IBooking) => {
  payload.user = user.authId!
  
  const result = await Booking.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Something went wrong while creating booking, please try again later.',
    );
  return result;
};

const getAllBookings = async () => {
  const result = await Booking.find().populate({
    path: 'user',
    select: 'name profile',
  }).populate({
    path: 'business',
    select: 'name profile',
  }).populate({
    path: 'request',
    select: 'title description _id discount ',
    populate: {
      path: 'business',
      select: 'name profile',
    }
  });
  return result;
};

const getSingleBooking = async (id: string) => {
  const result = await Booking.findById(id).populate({
    path: 'user',
    select: 'name profile',
  }).populate({
    path: 'business',
    select: 'name profile',
  }).populate({
    path: 'request',
    select: 'title description _id discount ',
    populate: {
      path: 'business',
      select: 'name profile',
    }
  });
  return result;
};

const updateBooking = async (
  id: string,
) => {

 const result = await Booking.findByIdAndUpdate(id, { status: 'completed' });
 if (!result)
   throw new ApiError(
     StatusCodes.BAD_REQUEST,
     'Something went wrong while updating booking, please try again later.',
   );
 return result;
};

const deleteBooking = async (id: string) => {
  const result = await Booking.findByIdAndDelete(id);
  return result;
};

export const BookingServices = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
};
