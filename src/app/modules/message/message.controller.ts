import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { paginationFields } from "../../../interfaces/pagination";
import pick from "../../../shared/pick";
import { MessageServices } from "./message.service";



const getMessageByChatController = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  const { requestId, status } = req.query
  const paginationOptions = pick(req.query, paginationFields)
  const result = await MessageServices.getMessageByChat(req.user!, chatId, requestId as string, status as 'new' | 'ongoing' | 'completed', paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  })
})

const sendMessageController = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params

  const { image, ...chatData } = req.body

  if (image?.length > 0) chatData.images = image
  chatData.chat = chatId
  
  const result = await MessageServices.sendMessage(req.user!, chatData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message sent successfully',
    data: result,
  })
})

const enableChatController = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  const result = await MessageServices.enableChat(chatId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat enabled successfully',
    data: result,
  })
})

export const MessageController = {
  getMessageByChat: getMessageByChatController,
  sendMessage: sendMessageController,
  enableChat: enableChatController,
}
  