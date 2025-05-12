import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IOffer } from './offer.interface'
import { Offer } from './offer.model'
import { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'

const createOffer = async (user: JwtPayload, payload: IOffer) => {
  payload.business = user.authId
  const result = await Offer.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Offer')
  return result
}

const getAllOffers = async (user: JwtPayload) => {
  const result = await Offer.find({ business: user.authId, status: 'active' })
    .populate('business', 'businessName location address profile zipcode')
    .lean()
  return result
}

const getSingleOffer = async (id: string) => {
  const result = await Offer.findById(id)
    .populate('business', 'businessName profile address zipCode location')
    .lean()
  if (result?.status === 'inactive') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'The requested offer is not available at the moment. Please try again later.',
    )
  }
  return result
}

const updateOffer = async (
  user: JwtPayload,
  id: string,
  payload: Partial<IOffer>,
) => {
  if (payload.default === true) {
    await Offer.updateMany(
      {
        business: user.authId,
        status: 'active',
      },
      { $set: { default: false } },
    )
  }

  const result = await Offer.findOneAndUpdate(
    {
      _id: id,
      business: user.authId,
      status: 'active', // Assuming you only want to update active offers
    },
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'The requested offer not found.')
  }

  return 'Offer updated successfully.'
}

const deleteOffer = async (user: JwtPayload, id: string) => {
  const result = await Offer.findOneAndUpdate(
    {
      _id: id,
      business: user.authId,
      status: 'active',
    },
    { $set: { status: 'inactive' } },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'The requested offer not found.')
  }

  return 'Offer deleted successfully.'
}

export const OfferServices = {
  createOffer,
  getAllOffers,
  getSingleOffer,
  updateOffer,
  deleteOffer,
}
