import { Request, Response } from 'express';
  import { BookingServices } from './booking.service';
  import catchAsync from '../../../shared/catchAsync';
  import sendResponse from '../../../shared/sendResponse';
  import { StatusCodes } from 'http-status-codes';
  
  const createBooking = catchAsync(async (req: Request, res: Response) => {
    const bookingData = req.body;
    const result = await BookingServices.createBooking(req.user!, bookingData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Booking created successfully',
      data: result,
    });
  });
  
  const updateBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await BookingServices.updateBooking(req.user!, id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Booking updated successfully',
      data: result,
    });
  });
  
  const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BookingServices.getSingleBooking(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Booking retrieved successfully',
      data: result,
    });
  });
  
  const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const result = await BookingServices.getAllBookings();
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Bookings retrieved successfully',
      data: result,
    });
  });
  
  const deleteBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BookingServices.deleteBooking(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Booking deleted successfully',
      data: result,
    });
  });
  
  export const BookingController = {
    createBooking,
    updateBooking,
    getSingleBooking,
    getAllBookings,
    deleteBooking,
  };