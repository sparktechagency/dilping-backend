import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { Message } from "./message.model";
import { paginationFields } from "../../../interfaces/pagination";
import pick from "../../../shared/pick";
import { MessageServices } from "./message.service";

const getMessageByChat = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  const paginationOptions = pick(req.query, paginationFields)
  const result = await MessageServices.getMessageByChat(chatId, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  })
})

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params
  const payload = req.body
  payload.chat = chatId
  const result = await MessageServices.sendMessage(req.user!, payload)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message sent successfully',
    data: result,
  })
})

const enableChat = catchAsync(async (req: Request, res: Response) => {
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
  getMessageByChat,
  sendMessage,
  enableChat,
}
  