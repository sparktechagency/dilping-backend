import { RequestUtils } from './request.utils';

import mongoose from 'mongoose'
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
const createRequest = async (
  user: JwtPayload,
  data: IRequest & { coordinates: [number, number]; radius: number },
) => {
  const userId = user.authId!
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // 1. User existence check with cache
    const userExist = await User.findById(userId).session(session).lean()
    if (!userExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (userExist.status !== USER_STATUS.ACTIVE) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to create a request",
      )
    }

    // const resolution = getResolutionByRadius(data.radius)
    // const centerIndex = latLngToCell(
    //   data.coordinates[1],
    //   data.coordinates[0],
    //   resolution,
    // )

    // const h3Indexes = gridDisk(centerIndex, data.radius)
    // const compacted = compactCells(h3Indexes)
    // console.log(compacted, 'compacted')

    // console.log(h3Indexes, 'h3Indexes')
    //2. Get all the businesses in the radius

    const businesses = await RequestUtils.getBusinessesWithingRadius(
      data.radius,
      data.coordinates[1],
      data.coordinates[0],
      session,
    )

    const businessIds = businesses.map((business: IUser) => business._id)

    //3. Get all the offers available for businesses
    const offers = await Offer.find({
      business: {
        $in: businessIds,
      },
      status: 'active',
      default: true,
    }).session(session)

    const offerMap = new Map(
      offers.map(offer => [
        offer.business.toString(),
        { offerID: offer._id, offerTitle: offer.title },
      ]),
    )

    const request = await createRequestDocument(userId, data, session)

    await processBusinessChats(userId, businessIds, request, offerMap, session)

    //6. Return the request
    await session.commitTransaction()

    return request
  } catch (error) {
    await session.abortTransaction()
    logger.error('Request creation failed', error)
    throw error
  } finally {
    await session.endSession()
  }
}

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
