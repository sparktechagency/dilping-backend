import { RequestUtils } from './request.utils';

import mongoose, { Types } from 'mongoose'
import { SocketWithUser } from '../../../helpers/socketHelper'
import { IRequest, IRequestFilters } from './request.interface'
import { User } from '../user/user.model' // Updated User model with H3
import { logger } from '../../../shared/logger'
import { Offer } from '../offer/offer.model'
import { Request } from './request.model'
import { Chat } from '../chat/chat.model'
import { Message } from '../message/message.model'

import { JwtPayload } from 'jsonwebtoken'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

import { USER_STATUS } from '../../../enum/user'
 
import { IUser } from '../user/user.interface'
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { filterableFields, searchableFields } from './request.constants';
import { REDIS_KEYS } from '../../../enum/redis';
import { redisClient } from '../../../helpers/redis.client';
import { IOffer } from '../offer/offer.interface';


const createRequest = async (
  user: JwtPayload,
  data: IRequest & { coordinates: [number, number]; radius: number },
) => {
  const userId = user.authId!;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. User existence check with session consistency
    const userExist = await User.findById(userId).session(session).lean();
    if (!userExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    if (userExist.status !== USER_STATUS.ACTIVE) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to create a request",
      );
    }

    // 2. Get businesses within radius (corrected function name typo)
    const businesses = await RequestUtils.getBusinessesWithinRadius(
      data.radius,
      data.coordinates[1], // longitude
      data.coordinates[0], // latitude
      session,
    );

    const businessIds = businesses.map((business: IUser) => business._id);
    const redisKeys = businessIds.map((id: Types.ObjectId) => `${REDIS_KEYS.DEFAULT_OFFERS}:${id}`);

    // 3. Cache retrieval and processing
    const offersInCache = await redisClient.mGet(redisKeys);
    const offerMap = new Map();
    const offersToCache: Types.ObjectId[] = [];

    // Process cached and non-cached offers
    offersInCache.forEach((cached, index) => {
      if (cached) {
        try {
          const parsedOffer = JSON.parse(cached);
          offerMap.set(
            businessIds[index].toString(), 
            parsedOffer
          );
        } catch (parseError) {
          // Treat parse failure as cache miss
          offersToCache.push(businessIds[index]);
        }
      } else {
        offersToCache.push(businessIds[index]);
      }
    });

    // 4. Fetch and cache missing offers
    if (offersToCache.length > 0) {
      const offers = await Offer.find({
        business: { $in: offersToCache },
        status: 'active',
        default: true,
      }).session(session);

      const redisPipeline = redisClient.multi();
      for (const offer of offers) {
        const offerData = {
          _id: offer._id,
          title: offer.title,
          description: offer.description,
        };
        
        offerMap.set(
          offer.business.toString(), 
          offerData
        );
        
        redisPipeline.set(
          `${REDIS_KEYS.DEFAULT_OFFERS}:${offer.business}`,
          JSON.stringify(offerData)
        );
      }
      
      try {
        await redisPipeline.exec();
      } catch (redisError) {
        logger.warn('Redis cache update failed', redisError);
        // Non-critical failure, proceed without caching
      }
    }

    // 5. Create request and process business chats
    const request = await createRequestDocument(userId, data, session);
    await processBusinessChats(
      userId,
      businessIds,
      request,
      offerMap,
      session
    );

    // 6. Commit transaction
    await session.commitTransaction();
    return request;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Request creation failed', error);
    
    // Convert to standardized error if needed
    if (!(error instanceof ApiError)) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Request creation failed'
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const createRequestDocument = async (
  userId: string,
  data: IRequest & { coordinates: [number, number]; radius: number },
  session: mongoose.ClientSession,
) => {
  const [request] = await Request.create(
    [
      {
        user: userId,
        message: data.message,
        coordinates: data.coordinates,
        radius: data.radius,
        h3Index: null,
      },
    ],
    { session },
  )
  return request
}

const processBusinessChats = async (
  userId: string,
  businessIds: mongoose.Types.ObjectId[],
  request: IRequest,
  offerMap: Map<
    string,
    { offerID: mongoose.Types.ObjectId; offerTitle: string }
  >,
  session: mongoose.ClientSession,
) => {
  const chatDocs = businessIds.map(businessId => ({
    request: request._id,
    participants: [new mongoose.Types.ObjectId(userId), businessId],
    latestMessage: offerMap.get(businessId.toString())?.offerTitle || '',
    isEnabled: offerMap.has(businessId.toString()),
  }))

  const chats = await Chat.insertMany(chatDocs, { session })

  const messageDocs = chats
    .filter(chat => chat.isEnabled)
    .map(chat => ({
      chat: chat._id,
      sender: new mongoose.Types.ObjectId(userId),
      message: offerMap.get(chat.participants[1].toString())?.offerTitle || '',
      offer: offerMap.get(chat.participants[1].toString())?.offerID,
    }))

  if (messageDocs.length > 0) {
    const messages = await Message.insertMany(messageDocs, { session })
  }
}

const getAllRequests = async (user: JwtPayload, filters: IRequestFilters, paginationOptions: IPaginationOptions) => {
  const {searchTerm} = filters
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);


  const andCondition: any[] = []

  if(searchTerm){
    searchableFields.forEach(field => {
      andCondition.push({
        [field]: { $regex: searchTerm, $options: 'i' },
      })
    })
  }

  if(Object.keys(filters).length){
    filterableFields.forEach(field => {
      if(filters[field as keyof IRequestFilters]){
        andCondition.push({
          [field]: filters[field as keyof IRequestFilters],
        })
      }
    })
  }

  andCondition.push({user: user.authId!})
  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {user: user.authId!}

  const requests = await Request.find({
    ...whereCondition,
  }).sort({[sortBy]: sortOrder}).skip(skip).limit(limit).lean()

  const total = await Request.countDocuments(whereCondition)
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: requests
  };
}

export const RequestService = {
  createRequest,
  getAllRequests,
}
