import { Request, Response } from 'express'
import { ChatServices } from './chat.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { paginationFields } from '../../../interfaces/pagination'
import pick from '../../../shared/pick'

const createChat = catchAsync(async (req: Request, res: Response) => {
  const chatData = req.body
  const result = await ChatServices.createChat(chatData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Chat created successfully',
    data: result,
  })
})

const updateChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const chatData = req.body
  const result = await ChatServices.updateChat(id, chatData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat updated successfully',
    data: result,
  })
})

const getSingleChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ChatServices.getSingleChat(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat retrieved successfully',
    data: result,
  })
})

const getAllChatsForUser = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params
  const paginationOptions = pick(req.query, paginationFields)
  const result = await ChatServices.getAllChatsForUser(req.user!, requestId, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chats retrieved successfully',
    data: result,
  })
})

const getAllChatForBusinesses = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields)
  const status = req.query.status as 'new' | 'ongoing' | 'completed'
  const result = await ChatServices.getAllChatForBusinesses(req.user!, status, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chats retrieved successfully',
    data: result,
  })
})

const deleteChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ChatServices.deleteChat(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat deleted successfully',
    data: result,
  })
})

export const ChatController = {
  createChat,
  updateChat,
  getSingleChat,
  getAllChatsForUser,
  getAllChatForBusinesses,
  deleteChat,
}
