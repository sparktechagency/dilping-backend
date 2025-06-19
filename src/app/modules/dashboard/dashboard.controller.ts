import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { DashboardService } from "./dashboard.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../../shared/pick";
import { BookingFilterableFields, DashboardFilterableFields } from "./dashboard.interface";
import { paginationFields } from "../../../interfaces/pagination";

const getGeneralStats = catchAsync(async(req:Request, res:Response)=>{
    const stats = await DashboardService.getGeneralStats()
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'General stats retrieved successfully',
        data: stats,
    })
})

const getCategoryStats = catchAsync(async(req:Request, res:Response)=>{
    const stats = await DashboardService.getCategoryStats()
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Category stats retrieved successfully',
        data: stats,
    })
})

const getSubCategoryStatsByCategory = catchAsync(async(req:Request, res:Response)=>{
    const stats = await DashboardService.getSubCategoryStatsByCategory(req.params.categoryId)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Subcategory stats retrieved successfully',
        data: stats,
    })
})

const getBookingStats = catchAsync(async(req:Request, res:Response)=>{
    const stats = await DashboardService.getBookingStats(req.params.categoryId)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Booking stats retrieved successfully',
        data: stats,
    })
})

const getCustomerStats = catchAsync(async(req:Request, res:Response)=>{
    const stats = await DashboardService.getCustomerStats()
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Customer stats retrieved successfully',
        data: stats,
    })
})

const getAllUser = catchAsync(async(req:Request, res:Response)=>{
    const filters = pick(req.query, DashboardFilterableFields)
    const paginationOptions = pick(req.query, paginationFields)
    const businesses = await DashboardService.getAllUser(filters, paginationOptions)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Businesses retrieved successfully',
        data: businesses,
    })
})

const getBusinessStats = catchAsync(async(req:Request, res:Response)=>{
    const filters = pick(req.query, DashboardFilterableFields)
    const paginationOptions = pick(req.query, paginationFields)
    const stats = await DashboardService.getBusinessStats(filters, paginationOptions)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Business stats retrieved successfully',
        data: stats,
    })
})

const getAllBookings = catchAsync(async(req:Request, res:Response)=>{
    const filters = pick(req.query, BookingFilterableFields)
    const paginationOptions = pick(req.query, paginationFields)
    const bookings = await DashboardService.getAllBookings(filters, paginationOptions)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: bookings,
    })
})

export const DashboardController = {
    getGeneralStats,
    getCategoryStats,
    getSubCategoryStatsByCategory,
    getBookingStats,
    getCustomerStats,
    getAllUser,
    getBusinessStats,
    getAllBookings
}
