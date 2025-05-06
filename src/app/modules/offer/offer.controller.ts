import { Request, Response } from 'express'
import { OfferServices } from './offer.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'

const createOffer = catchAsync(async (req: Request, res: Response) => {
  const offerData = req.body

  const result = await OfferServices.createOffer(req.user!, offerData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Offer created successfully',
    data: result,
  })
})

const updateOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const offerData = req.body
  const result = await OfferServices.updateOffer(req.user!, id, offerData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Offer updated successfully',
    data: result,
  })
})

const getSingleOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await OfferServices.getSingleOffer(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Offer retrieved successfully',
    data: result,
  })
})

const getAllOffers = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferServices.getAllOffers(req.user!)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Offers retrieved successfully',
    data: result,
  })
})

const deleteOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await OfferServices.deleteOffer(req.user!, id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Offer deleted successfully',
    data: result,
  })
})

export const OfferController = {
  createOffer,
  updateOffer,
  getSingleOffer,
  getAllOffers,
  deleteOffer,
}
