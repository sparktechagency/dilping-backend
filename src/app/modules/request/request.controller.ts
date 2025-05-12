import { Request, Response } from 'express';
  import { RequestServices } from './request.service';
  import catchAsync from '../../../shared/catchAsync';
  import sendResponse from '../../../shared/sendResponse';
  import { StatusCodes } from 'http-status-codes';
  
  const createRequest = catchAsync(async (req: Request, res: Response) => {
    const requestData = req.body;
    const result = await RequestServices.createRequest(requestData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Request created successfully',
      data: result,
    });
  });
  
  const updateRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestData = req.body;
    const result = await RequestServices.updateRequest(id, requestData);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Request updated successfully',
      data: result,
    });
  });
  
  const getSingleRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await RequestServices.getSingleRequest(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Request retrieved successfully',
      data: result,
    });
  });
  
  const getAllRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await RequestServices.getAllRequests();
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Requests retrieved successfully',
      data: result,
    });
  });
  
  const deleteRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await RequestServices.deleteRequest(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Request deleted successfully',
      data: result,
    });
  });
  
  export const RequestController = {
    createRequest,
    updateRequest,
    getSingleRequest,
    getAllRequests,
    deleteRequest,
  };