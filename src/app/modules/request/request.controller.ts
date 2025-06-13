import { paginationFields } from '../../../interfaces/pagination'
import catchAsync from '../../../shared/catchAsync'
import pick from '../../../shared/pick'
import sendResponse from '../../../shared/sendResponse'
import { filterableFields } from './request.constants'
import { RequestService } from './request.service'
import { StatusCodes } from 'http-status-codes'
const createRequest = catchAsync(async (req, res) => {
  const { ...requestData } = req.body
  const result = await RequestService.createRequest(req.user!, requestData)
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Request created successfully',
    data: result,
  })
})

const getAllRequests = catchAsync(async (req, res) => {
  const filters = pick(req.query, filterableFields)
  const paginationOptions = pick(req.query, paginationFields)
  const result = await RequestService.getAllRequests(req.user!, filters, paginationOptions)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Requests retrieved successfully',
    data: result,
  })
})

export const RequestController = {
  createRequest,
  getAllRequests,
}
