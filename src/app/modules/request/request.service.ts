import mongoose from 'mongoose'
import { SocketWithUser } from '../../../helpers/socketHelper'
import { IRequest } from './request.interface'
import { User } from '../user/user.model'
import { logger } from '../../../shared/logger'
import { Offer } from '../offer/offer.model'
import { Request } from './request.model'
import { Chat } from '../chat/chat.model'
import { Message } from '../message/message.model'
import {
  cacheRequestResults,
  cachedFindUsersInRadius,
  cachedGetDefaultOffersMap,
  cachedUserExists,
} from '../../../utils/redis'

const createRequest = async (
  socket: SocketWithUser,
  data: IRequest & { coordinates: [number, number]; radius: number },
) => {
  const userId = socket.user?.authId!
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // 1. User existence check with cache
    const userExists = await cachedUserExists(userId, session)
    if (!userExists) throw new Error('User not found')

    // 2. Get businesses with geo-grid caching
    const businesses = await cachedFindUsersInRadius(
      data.coordinates[0],
      data.coordinates[1],
      data.radius,
    )

    const businessIds = businesses.map(b => b._id)
    if (businessIds.length === 0) {
      throw new Error('No businesses found within radius')
    }

    // 3. Get default offers with Redis caching
    const offerMap = await cachedGetDefaultOffersMap(businessIds, session)

    // 4. Create request document
    const request = await createRequestDocument(userId, data, session)

    // 5. Process chats and messages
    await processBusinessChats(
      userId,
      businessIds,
      request,
      offerMap,
      data.message,
      session,
    )

    await session.commitTransaction()

    // 6. Cache request results for UI
    await cacheRequestResults(request, businesses, offerMap)

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
  offerMap: Map<string, mongoose.Types.ObjectId>,
  requestMessage: string,
  session: mongoose.ClientSession,
) => {
  const chatDocs = businessIds.map(businessId => ({
    request: request._id,
    participants: [userId, businessId],
    isEnabled: offerMap.has(businessId.toString()),
  }))

  const chats = await Chat.insertMany(chatDocs, { session })

  const messageDocs = chats
    .filter(chat => chat.isEnabled)
    .map(chat => ({
      chat: chat._id,
      receiver: userId,
      message: requestMessage,
      type: 'offer' as const,
      offer: offerMap.get(chat.participants[1].toString()),
    }))

  if (messageDocs.length > 0) {
    await Message.insertMany(messageDocs, { session })
  }
}

export const RequestService = {
  createRequest,
}
