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

import { redisClient } from '../../../helpers/redis.client';
import { sendDataWithSocket } from '../../../helpers/notificationHelper';


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
    if(businessIds.length === 0){
      throw new ApiError(StatusCodes.NOT_FOUND, 'Sorry we could not find any businesses in your desired location.');
    }
    // 3. Cache retrieval and processing
    const offerMap = new Map();

    const offers = await Offer.find({
      business: { $in: businessIds },
      default: 'true',

    }).session(session);
    offers.forEach(offer => {
      offerMap.set(offer.business.toString(), offer);
    })



    // 5. Create request and process business chats
    const request = await createRequestDocument(user.authId!, data, businessIds, session);
    await processBusinessChats(
      user,
      userExist,
      businessIds,
      request,
      offerMap,
      businesses,
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
  userExist: IUser,
  businessIds: mongoose.Types.ObjectId[],
  request: IRequest,
  offerMap: Map<string, { _id: mongoose.Types.ObjectId; title: string; description: string }>,
  businesses: IUser[],
  session: mongoose.ClientSession,
) => {
  const userId = new mongoose.Types.ObjectId(user.authId!);
  const chatDocs = [];
  const messageDocs = [];
  const chatsToUpdate = [];

  // Step 1: Check for existing chats and prepare new ones
  for (const business of businesses) {
    const businessIdStr = business._id.toString();
    const hasOffer = offerMap.has(businessIdStr);



    // Check if chat already exists between user and business
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, business._id] }
    }).session(session);

    if (existingChat) {
      // Update existing chat to include new request
      chatsToUpdate.push({
        chatId: existingChat._id,
        businessId: business._id,
        hasOffer
      });
    } else {
      // Create new chat document
      chatDocs.push({
        requests: [request._id],
        participants: [userId, business._id],
        latestMessage: request.message,
        latestMessageTime: new Date(),
        isEnabled: hasOffer,
        isMessageEnabled: hasOffer ? false : true,
        distance: calculateDistance(request.coordinates, business.location.coordinates),
        isDeleted: false,
      });
    }
  }

  // Step 2: Update existing chats with new request
  const updatedChats = [];
  for (const chatUpdate of chatsToUpdate) {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatUpdate.chatId,
      { 
        $addToSet: { requests: request._id },
        latestMessage: request.message,
        latestMessageTime: new Date(),
        isEnabled: chatUpdate.hasOffer,
        isMessageEnabled: chatUpdate.hasOffer ? false : true,
      },
      { new: true, session }
    );
    if (updatedChat) {
      updatedChats.push(updatedChat);
    }
  }

  // Step 3: Insert new chats
  const newChats = chatDocs.length > 0 ? await Chat.insertMany(chatDocs, { session }) : [];
  const allChats = [...updatedChats, ...newChats];


  // Step 4: Create messages for each chat
  for (const chat of allChats) {
    const businessIdStr = chat.participants.find(id => id.toString() !== userId.toString())?.toString();
    const hasOffer = businessIdStr ? offerMap.has(businessIdStr) : false;
    const offer = businessIdStr ? offerMap.get(businessIdStr) : null;

    // Message 1: User → Business (request message) - linked to specific request
    messageDocs.push({
      chat: chat._id,
      request: request._id,
      sender: userId,
      receiver: chat.participants.find(id => id.toString() !== userId.toString())!,
      message: request.message,
      type: 'text' as const,
      status: 'new' as const,
    });

    // Message 2 (Optional): Business → User (offer message) - linked to specific request
    if (hasOffer && offer) {
      messageDocs.push({
        chat: chat._id,
        request: request._id,
        sender: chat.participants.find(id => id.toString() !== userId.toString())!,
        receiver: userId,
        message: offer.title,
        offerTitle: offer.title,
        offerDescription: offer.description,
        type: 'offer' as const,
        status: 'new' as const,
      });
    }
  }

  // Step 5: Insert all messages
  if (messageDocs.length > 0) {
    await Message.insertMany(messageDocs, { session });
  }

  // Step 6: Send socket notifications for new chats and messages
  for (const chat of allChats) {
    const businessId = chat.participants.find(id => id.toString() !== userId.toString())?.toString();
    if (businessId) {
      // Check if this is a new chat (not in updatedChats)
      const isNewChat = !updatedChats.some(updatedChat => updatedChat._id.toString() === chat._id.toString());
      
      if (isNewChat) {

        const {participants, requests, _id:chatID, latestMessage, latestMessageTime, isEnabled, isMessageEnabled, distance, isDeleted,createdAt,updatedAt} = chat

      


        // Send new chat notification to business
        sendDataWithSocket('newChat', businessId, {
          chat: chatID,
          participant: {
            _id: userExist._id,
            name: userExist.name,
            email: userExist.email,
            profile: userExist.profile,

          },
          requests,
          latestMessage,
          latestMessageTime,
          isEnabled,
          isMessageEnabled,
          distance,
          isDeleted,
          createdAt,
          updatedAt,

        });

      } else {
        // Send new message notification for existing chat
        sendDataWithSocket('message', businessId, {
          chat: chat._id,
          request: {
            _id: request._id,
            message: request.message,
          },
          sender: {
            _id: user.authId,
            name: user.name,
            email: user.email,
          },
          receiver: businessId,
          message: request.message,
          type: 'text',
          status: 'new'
        });
      }

      // Send offer message notification to user if offer exists -> not necessary user will go to chat list to see the message and message will be load their with api calls
      // const hasOffer = offerMap.has(businessId);
      // if (hasOffer) {
      //   const offer = offerMap.get(businessId);
      //   sendDataWithSocket('message', userId.toString(), {
      //     chat: chat,
      //     business: businesses.find(b => b._id.toString() === businessId),
      //     offer: offer,
      //     request: request
      //   });
      // }
    }
  }

  // Step 7: Send notifications to businesses
  RequestUtils.sendRequestNotificationsToBusinessesWithData(user, request, allChats);

  return allChats;
};

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


