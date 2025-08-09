import { RequestUtils } from './request.utils';

import mongoose, { Types } from 'mongoose'
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
import { calculateDistance, filterableFields, searchableFields } from './request.constants';
import { REDIS_KEYS } from '../../../enum/redis';
import { redisClient } from '../../../helpers/redis.client';


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
      data.category,
      data.subCategories,
    );

    const businessIds = businesses.map((business: IUser) => business._id);
    const redisKeys = businessIds.map((id: Types.ObjectId) => `${REDIS_KEYS.DEFAULT_OFFERS}:${id}`);


    if(businessIds.length === 0){
      throw new ApiError(StatusCodes.NOT_FOUND, 'Sorry we could not find any businesses in your desired location.');
    }
    // 3. Cache retrieval and processing
    const offersInCache = await redisClient.mget(redisKeys);
    const offerMap = new Map();
    const offersToCache: Types.ObjectId[] = [];

    // Process cached and non-cached offers
    offersInCache.forEach((cached:any, index:number) => {
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
    const request = await createRequestDocument(user.authId!, data, businessIds, session);
    await processBusinessChats(
      user,
      businessIds,
      request,
      offerMap,
      businesses,
      session
    );

    //invalidate cache
    await redisClient.del(`requests:${user.authId}:${JSON.stringify(data.category)}:${JSON.stringify(1)}`);

    // 6. Commit transaction
    await session.commitTransaction();
    return request;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Request creation failed', error);
    
    // Convert to standardized error if needed
    if (!(error instanceof ApiError)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
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
  businessIds: mongoose.Types.ObjectId[],
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
        businesses: businessIds,
        category: data.category,
        subCategories: data.subCategories,
      },
    ],
    { session },
  )
  



  return request
}

const processBusinessChats = async (
  user: JwtPayload,
  businessIds: mongoose.Types.ObjectId[],
  request: IRequest,
  offerMap: Map<string, { _id: mongoose.Types.ObjectId; title: string; description: string }>,
  businesses: IUser[],
  session: mongoose.ClientSession,
) => {
  const userId = new mongoose.Types.ObjectId(user.authId!);
  const chatDocs = [];
  const messageDocs = [];

  // Step 1: Prepare chats and invalidate cache
  for (const business of businesses) {
    const businessIdStr = business._id.toString();
    const hasOffer = offerMap.has(businessIdStr);
    // const offer = offerMap.get(businessIdStr);

    // Invalidate chat cache for pagination
    await redisClient.del(
      `chat:user:new-${businessIdStr}-1`,
      `chat:user:ongoing-${businessIdStr}-1`,
      `chat:user-${userId.toString()}:${request.category.toString()}`,
      `chat:business-${businessIdStr}:${request.category.toString()}`
    );

    // Create new chat document
    chatDocs.push({
      request: request._id,
      participants: [userId, business._id],
      latestMessage: request.message, // User's message is the first message
      lastMessageTime: new Date(),
      isEnabled: hasOffer, // Whether this chat has an enabled offer
      isMessageEnabled: hasOffer ? false : true, // Disable messaging if offer exists
      status: 'new' as const,
      distance: calculateDistance(request.coordinates, business.location.coordinates),
      isDeleted: false,
    });
  }

  // Step 2: Insert all chats
  const chats = await Chat.insertMany(chatDocs, { session });

  // Step 3: Create messages for each chat
  for (const chat of chats) {
    const businessIdStr = chat.participants.find(id => id.toString() !== userId.toString())?.toString();
    const hasOffer = businessIdStr ? offerMap.has(businessIdStr) : false;
    const offer = businessIdStr ? offerMap.get(businessIdStr) : null;

    // Message 1: User → Business (request message)
    messageDocs.push({
      chat: chat._id,
      sender: userId,
      receiver: chat.participants.find(id => id.toString() !== userId.toString())!,
      message: request.message,
      type: 'text' as const,
    });

    // Message 2 (Optional): Business → User (offer message)
    if (hasOffer && offer) {
      messageDocs.push({
        chat: chat._id,
        sender: chat.participants.find(id => id.toString() !== userId.toString())!,
        receiver: userId,
        message: offer.title,
        offerTitle: offer.title,
        offerDescription: offer.description,
        type: 'offer' as const,
      });
    }
  }

  // Step 4: Insert all messages
  if (messageDocs.length > 0) {
    await Message.insertMany(messageDocs, { session });
  }

  // Step 5: Send notifications to businesses
  RequestUtils.sendRequestNotificationsToBusinessesWithData(user, request, chats);

  return chats;
};

const getAllRequests = async (user: JwtPayload, filters: IRequestFilters, paginationOptions: IPaginationOptions) => {
  const {searchTerm} = filters
  const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);


  const andCondition: any[] = []

  const cacheKey = `requests:${user.authId}:${JSON.stringify(filters.category)}:${JSON.stringify(page)}`;
  if(!searchTerm){
   const cachedData = await redisClient.get(cacheKey);
   if(cachedData){
    return JSON.parse(cachedData)
   }
  }

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

 if(requests.length > 0){
  await redisClient.set(cacheKey, JSON.stringify({
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: requests
  }), 'EX', 60 * 10)
 }

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


