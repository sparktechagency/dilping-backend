import { Request, Response } from 'express';
  import { MessageServices } from './message.service';
  import catchAsync from '../../../shared/catchAsync';
  import sendResponse from '../../../shared/sendResponse';
  import { StatusCodes } from 'http-status-codes';
  
  const createMessage = catchAsync(async (req: Request, res: Response) => {
    const messageData = req.body;
    const result = await MessageServices.createMessage(messageData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Message created successfully',
      data: result,
    });
  });
  
  const updateMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const messageData = req.body;
    const result = await MessageServices.updateMessage(id, messageData);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Message updated successfully',
      data: result,
    });
  });
  
  const getSingleMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await MessageServices.getSingleMessage(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Message retrieved successfully',
      data: result,
    });
  });
  
  const getAllMessages = catchAsync(async (req: Request, res: Response) => {
    const result = await MessageServices.getAllMessages();
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Messages retrieved successfully',
      data: result,
    });
  });
  
  const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await MessageServices.deleteMessage(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Message deleted successfully',
      data: result,
    });
  });
  
  export const MessageController = {
    createMessage,
    updateMessage,
    getSingleMessage,
    getAllMessages,
    deleteMessage,
  };