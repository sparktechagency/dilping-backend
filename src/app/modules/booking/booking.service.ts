import { query } from 'winston';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IBooking } from './booking.interface';
import { Booking } from './booking.model';
import { JwtPayload } from 'jsonwebtoken';
import { sendDataWithSocket, sendNotification } from '../../../helpers/notificationHelper';
import { IUser, Point } from '../user/user.interface';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { USER_ROLES } from '../../../enum/user';
import mongoose, { Types } from 'mongoose';
import { Chat } from '../chat/chat.model';
import { IRequest } from '../request/request.interface';
import { Request } from '../request/request.model';
import { redisClient } from '../../../helpers/redis.client';
import { notificationQueue } from '../../../helpers/bull-mq-producer';
import { generateDataPoints } from '../../../utils/data-formatters';

const createBooking = async (user: JwtPayload, payload: IBooking) => {
  payload.user = user.authId!
  
  const result = await Booking.create(payload).then(doc => 
    doc.populate([
      { path: 'user', select: 'profile name' },
      { path: 'business'},
      { path: 'request'},
      { path: 'category'}
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
      receiver: result.business._id.toString(),
    }


  //  await sendNotification(notificationData)
 await notificationQueue.add('notifications', notificationData, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3 seconds initial delay
    },
  });



  return result;
};

const getAllBookings = async (user: JwtPayload,status: 'upcoming' | 'completed',userLocation:string[]  ,paginationOptions: IPaginationOptions) => {
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);

  const userQuery = user.role === USER_ROLES.USER ? {user:user.authId} : {business:user.authId}
  const query = status.toLowerCase() === 'upcoming' ? {...userQuery,status: 'booked'} : {...userQuery,status: status.toLowerCase()}
  
  const [result, total] = await Promise.all([
    Booking.find(query).populate('category').populate('subCategories').populate({
      path: 'user',
      select: 'name profile',
    }).populate<{business: IUser}>({
      path: 'business',
    }).populate({
      path: 'request',
      select: 'title description _id discount ',
    }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean(),
    Booking.countDocuments(query)
  ]);

  const calculateDistance = ( businessLocation: Point) => {
    console.log(userLocation, businessLocation)
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 =Number(userLocation[1]);
    const lon1 = Number(userLocation[0]);
    const lat2 = Number(businessLocation.coordinates[1]);
    const lon2 = Number(businessLocation.coordinates[0]);
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const formattedResult = result.map((booking) => {
    return {
      ...booking,
     distance: calculateDistance(booking.business.location),
    }
  })

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: formattedResult
  };
};

const getSingleBooking = async (id: string) => {
  const result = await Booking.findById(id).populate({
    path: 'user',
    select: 'name profile',
  }).populate({
    path: 'business',
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

 const session = await mongoose.startSession()
 session.startTransaction()

 try {
  const result = await Booking.findByIdAndUpdate(id, { status: 'completed' }).populate({
    path: 'user',
    select: 'name profile',
  }).populate<{business: IUser}>({
    path: 'business',
    select: 'name profile businessName',
  }).populate({
    path: 'request',
  }).session(session).lean()
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Something went wrong while updating booking, please try again later.',
    );
 
    const updatedChat = await Chat.findByIdAndUpdate(result.chat, { status: 'completed' }).session(session)
    if (!updatedChat)
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Something went wrong while updating chat, please try again later.',
      );

        //del cache for chat
        const cacheKey = `chat:user:${'new'}-${result.business._id.toString()}-${1}`
        const secondCacheKey = `chat:user:${'ongoing'}-${result.business._id.toString()}-${1}`
        await redisClient.del(cacheKey, secondCacheKey)
 
    if(result.business._id.toString() !== user.authId.toString())
     throw new ApiError(
       StatusCodes.BAD_REQUEST,
       'You are not authorized to update this booking.',
     );
 

    await session.commitTransaction()
    await session.endSession()
    sendDataWithSocket('booking', result.user._id.toString(), result)
    sendDataWithSocket('booking', result.business._id.toString(), result)
    const notificationData = {
     title: result.offerTitle,
     body: `${result.business.businessName} has marked your booking ${result.offerTitle} as completed, to view the booking please open booking list.`,
     sender: user.authId!,
     receiver: result.user._id.toString(),
    }
 
    await sendNotification(notificationData)
  return result;
 }
 catch (error) {
  await session.abortTransaction()
 }
 finally {
  await session.endSession()
 }

};

const deleteBooking = async (id: string) => {
  const result = await Booking.findByIdAndDelete(id);
  return result;
};


const bookingGrowth = async (
  user: JwtPayload,
  year?: number,
  month?: number
) => {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month ? month - 1 : now.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const [bookings, requests] = await Promise.all([
    Booking.find({ business: user.authId, createdAt: { $gte: startDate, $lte: endDate } }),
    Request.find({ businesses: { $in: [user.authId] }, createdAt: { $gte: startDate, $lte: endDate } }),
  ]);

  const bookingCounts: Record<number, number> = {};
  const requestCounts: Record<number, number> = {};

  bookings.forEach(b => {
    const day = b.createdAt.getDate();
    bookingCounts[day] = (bookingCounts[day] || 0) + 1;
  });

  requests.forEach(r => {
    const day = r.createdAt.getDate();
    requestCounts[day] = (requestCounts[day] || 0) + 1;
  });

  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return {
    bookings: generateDataPoints(bookingCounts, daysInMonth, 7),
    requests: generateDataPoints(requestCounts, daysInMonth, 7),
  };
};


const bookingConversionGrowth = async (
  user: JwtPayload,
  year?: number,
  month?: number
) => {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month ? month - 1 : now.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Fetch only the two statuses we care about
  const bookings = await Booking.find({
    business: user.authId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $in: ["booked", "completed"] }
  }).select("createdAt status");

  const placedCounts: Record<number, number> = {};
  const convertedCounts: Record<number, number> = {};

  bookings.forEach(b => {
    const day = b.createdAt.getDate();

    if (b.status === "booked") {
      placedCounts[day] = (placedCounts[day] || 0) + 1;
    } else if (b.status === "completed") {
      convertedCounts[day] = (convertedCounts[day] || 0) + 1;
    }
  });

  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return {
    placed: generateDataPoints(placedCounts, daysInMonth, 7),
    converted: generateDataPoints(convertedCounts, daysInMonth, 7)
  };
};

export const BookingServices = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  bookingGrowth,
  bookingConversionGrowth,
};
