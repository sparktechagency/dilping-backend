import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IBooking } from './booking.interface';
import { Booking } from './booking.model';
import { JwtPayload } from 'jsonwebtoken';
import { sendDataWithSocket, sendNotification } from '../../../helpers/notificationHelper';

const createBooking = async (user: JwtPayload, payload: IBooking) => {
  payload.user = user.authId!
  
  const result = await Booking.create(payload).then(doc => 
    doc.populate([
      { path: 'user', select: 'profile name' },
      // { path: 'business', select: 'profile name' },
      { path: 'request',}
    ])
  );
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Something went wrong while creating booking, please try again later.',
    );
    
    sendDataWithSocket('booking', result.business.toString(), result)

    const notificationData = {
      title: result.offerTitle,
      body: `${user.name} has sent you a booking request, to view the booking please open booking list.`,
      sender: user.authId!,
      receiver: result.business.toString(),
    }

   await sendNotification(notificationData)


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
  user: JwtPayload,
  id: string,
) => {

 const result = await Booking.findByIdAndUpdate(id, { status: 'completed' }).populate({
   path: 'user',
   select: 'name profile',
 }).populate({
   path: 'business',
   select: 'name profile',
 }).populate({
   path: 'request',
 })
 if (!result)
   throw new ApiError(
     StatusCodes.BAD_REQUEST,
     'Something went wrong while updating booking, please try again later.',
   );

   sendDataWithSocket('booking', result.user.toString(), result)
   
   const notificationData = {
    title: result.offerTitle,
    body: `${user.name} has marked your booking ${result.offerTitle} as completed, to view the booking please open booking list.`,
    sender: user.authId!,
    receiver: result.user.toString(),
   }

   await sendNotification(notificationData)

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
