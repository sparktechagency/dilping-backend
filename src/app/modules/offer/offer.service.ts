import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IOffer } from './offer.interface'
import { Offer } from './offer.model'
import { JwtPayload } from 'jsonwebtoken'
import mongoose, { Types } from 'mongoose'
import { redisClient } from '../../../helpers/redis.client'
import { REDIS_KEYS } from '../../../enum/redis'
import { logger } from '../../../shared/logger'

const createOffer = async (user: JwtPayload, payload: IOffer) => {
  payload.business = user.authId
  const result = await Offer.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Offer')
  return result
}

const getAllOffers = async (user: JwtPayload) => {
  const result = await Offer.find({ business: user.authId })
    .lean()
    .sort({ default: -1 })
    
  return result
}

const getSingleOffer = async (id: string) => {
  const result = await Offer.findById(id)
    .lean()
 
  return result
}

const updateOffer = async (
  user: JwtPayload,
  id: string,
  payload: Partial<IOffer>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (payload.default === true) {
      await Offer.updateMany(
        {
          business: user.authId,

        },
        { $set: { default: false } },
        { session }
      );
    }

    const result = await Offer.findOneAndUpdate(
      {
        _id: id,
        business: user.authId,
      },
      { $set: { ...payload } },
      {
        new: true,
        session,
      },
    );


    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'The requested offer not found.');
    }

    // Invalidate Redis cache for this business
    try {
      await redisClient.del(`${REDIS_KEYS.DEFAULT_OFFERS}:${user.authId}`);
      logger.info(`Cache invalidated for business: ${user.authId}`);
    } catch (cacheError) {
      logger.warn('Offer cache invalidation failed', cacheError);
    }

    await session.commitTransaction();
    return 'Offer updated successfully.';
  } catch (error) {
    await session.abortTransaction();
    logger.error('Offer update failed', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

const deleteOffer = async (user: JwtPayload, id: string) => {
  try {
    const result = await Offer.findOneAndDelete({
      _id: id,
      business: user.authId,
    });

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'The requested offer not found.');
    }

    // Invalidate Redis cache only if deleted offer was default
    if (result.default) {
      try {
        await redisClient.del(`${REDIS_KEYS.DEFAULT_OFFERS}:${user.authId}`);
        logger.info(`Cache invalidated for business: ${user.authId}`);
      } catch (cacheError) {
        logger.warn('Offer cache invalidation failed', cacheError);
      }
    }

    return 'Offer deleted successfully.';
  } catch (error) {
    logger.error('Offer deletion failed', error);
    throw error;
  }
};

export const OfferServices = {
  createOffer,
  getAllOffers,
  getSingleOffer,
  updateOffer,
  deleteOffer,
}
