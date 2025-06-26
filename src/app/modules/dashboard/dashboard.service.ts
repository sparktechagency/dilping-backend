
import { Types } from "mongoose";
import { Booking } from "../booking/booking.model";
import { Category } from "../category/category.model";
import { Request } from "../request/request.model";
import { ISubcategory } from "../subcategory/subcategory.interface";
import { User } from "../user/user.model";
import {  BookingSearchableFields, DashboardSearchableFields, IBookingFilter, IDashboardFilterable } from "./dashboard.interface";
import { IPaginationOptions } from "../../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";

const getGeneralStats = async()=>{
    const [totalBusiness, totalCustomer, totalRequest, totalBooking] = await Promise.all([
        User.countDocuments({role: 'business'}),
        User.countDocuments({role: 'user'}),
        Request.countDocuments(),
        Booking.countDocuments(),
    ])

    return {
        totalBusiness,
        totalCustomer,
        totalRequest,
        totalBooking
    }
}

const getCategoryStats = async()=>{
 
    //first find all categories and then get all the bookings count for each category and calculate percentage of the booking by category 
    const categories = await Category.find()
    const totalBookingCount = await Booking.countDocuments() || 0
    const categoryStats = await Promise.all(categories.map(async(category)=>{
        const bookingCount = await Booking.countDocuments({category: category._id}) || 0
        const percentage = (bookingCount / (totalBookingCount ))*100 || 0
        return {
            categoryId: category._id,
            categoryTitle: category.title,
            categoryIcon: category.icon,
            bookingCount,
            percentage
        }
    }))
    return categoryStats    
}


const getSubCategoryStatsByCategory = async(categoryId: string)=>{
    const category = await Category.findById(new Types.ObjectId(categoryId)).populate<{subCategories: ISubcategory[]}>('subCategories')
    if(!category){
        throw new Error('Category not found')
    }

    const totalRequestCount = await Request.countDocuments() || 0
    const subCategoryStats = await Promise.all(category.subCategories.map(async(subCategory)=>{
        const requestCount = await Request.countDocuments({subCategories: {$in: subCategory._id}}) || 0
        const completeCount = await Booking.countDocuments({subCategories: {$in: subCategory._id}, status: 'completed'}) || 0
        const percentage = (requestCount / (totalRequestCount ))*100 || 0
        return {
            subCategoryId: subCategory._id,
            subCategoryTitle: subCategory.title,
            requestCount,
            completeCount,
            percentage
        }
    }))
    return subCategoryStats    
}


const getBookingStats = async(categoryId: string)=>{
    //return bookings, request, activeBooking counts based on current year and in 12 month format
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const bookingStats = await Promise.all(
        Array.from({length: 12}, (_, i) => i).map(async(month)=>{
            const [bookingCount, requestCount, activeBookingCount] = await Promise.all([
                Booking.countDocuments({createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }, category: categoryId}),
                Request.countDocuments({createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }, category: categoryId}),
                Booking.countDocuments({createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }, category: categoryId, status: { $ne: 'completed'}})
            ])
            return {
                month: monthNames[month],
                bookingCount,
                requestCount,
                activeBookingCount
            }
        })
    )
    return bookingStats
}

const getCustomerStats = async()=>{
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const customerStats = await Promise.all(
        Array.from({length: 12}, (_, i) => i).map(async(month)=>{
            const [activeProviderCount, registeredProviderCount, activeCustomerCount, registeredCustomerCount] = await Promise.all([
                Booking.distinct('business', {createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }, bookings: { $elemMatch: { status: 'completed'}}}),
                User.countDocuments({role: 'business', createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }}),
                Request.distinct('user', {createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }}),
                User.countDocuments({role: 'user', createdAt: { $gte: new Date(currentYear, month, 1), $lt: new Date(currentYear, month + 1, 1) }})
            ])
            return {
                month: monthNames[month],
                activeProviderCount: activeProviderCount.length,
                registeredProviderCount,
                activeCustomerCount: activeCustomerCount.length,
                registeredCustomerCount
            }
        })
    )
    return customerStats

}

const getAllUser = async(filters: IDashboardFilterable, pagination: IPaginationOptions)=>{
    const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(pagination)
    const {searchTerm, ...restFilters} = filters
    const andCondition: any[] = []
    if(searchTerm){
        DashboardSearchableFields.forEach(field => {
            andCondition.push({
                [field]: { $regex: searchTerm, $options: 'i' },
            })
        })
    }

    if(Object.keys(restFilters).length){
       andCondition.push({
        $and: Object.entries(restFilters).map(([field, value]) => ({
            [field]: value
        }))
       })
    }
    const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {}
    const [businesses, total] = await Promise.all([
        User.find({...whereCondition}).populate('category','title icon').populate('subCategories','title').sort({[sortBy]: sortOrder}).skip(skip).limit(limit),
        User.countDocuments({...whereCondition})
    ])
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: businesses
    }
}


const getBusinessStats = async (filters: IDashboardFilterable, pagination: IPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination)
    const { searchTerm, ...restFilters } = filters
  
    const andCondition: any[] = [{ role: 'business' }] // ensure only business users
    if (searchTerm) {
        andCondition.push({
          $or: DashboardSearchableFields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
          }))
        })
      }
      
      if (restFilters.category) {
        andCondition.push({ category: new Types.ObjectId(restFilters.category) })
      }
  
      const matchStage = {
        $match: andCondition.length ? { $and: andCondition } : {}
      }
      console.log('MATCH STAGE:', JSON.stringify(matchStage, null, 2))
    const aggregation = [
      matchStage,
      {
        $lookup: {
          from: 'chats',
          let: { businessUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$$businessUserId', '$participants'] }
              }
            },
            {
              $lookup: {
                from: 'requests',
                localField: 'request',
                foreignField: '_id',
                as: 'request'
              }
            },
            { $unwind: '$request' },
            {
              $group: {
                _id: '$request._id'
              }
            }
          ],
          as: 'uniqueRequests'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          let: { businessUserId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$businessUserId', '$business'] }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                completedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                  }
                },
                cancelledCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                  }
                }
              }
            }
          ],
          as: 'bookingStats'
        }
      },
      {
        $addFields: {
          requestCount: { $size: '$uniqueRequests' },
          bookingCount: {
            $ifNull: [{ $arrayElemAt: ['$bookingStats.count', 0] }, 0]
          },
          completedBookingCount: {
            $ifNull: [{ $arrayElemAt: ['$bookingStats.completedCount', 0] }, 0]
          },
          cancelledBookingCount: {
            $ifNull: [{ $arrayElemAt: ['$bookingStats.cancelledCount', 0] }, 0]
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          lastName: 1,
          businessName: 1,
          address: 1,
          city: 1,
          zipCode: 1,
          category: 1,
          subCategories: 1,
          requestCount: 1,
          bookingCount: 1,
          completedBookingCount: 1,
          cancelledBookingCount: 1
        }
      },
      { $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit }
    ]
  
    const [businesses, total] = await Promise.all([
        // @ts-ignore
      User.aggregate(aggregation),
      User.countDocuments({ ...(andCondition.length > 0 ? { $and: andCondition } : {}) })
    ])
  
    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: businesses
    }
  }


  const getAllBookings = async(filters: IBookingFilter, pagination: IPaginationOptions)=>{
    const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(pagination)
    const {searchTerm, ...restFilters} = filters
    const andCondition: any[] = []
    if(searchTerm){
      BookingSearchableFields.forEach(field => {
        andCondition.push({
          [field]: { $regex: searchTerm, $options: 'i' },
        })
      })
    }
    if(Object.keys(restFilters).length){
     andCondition.push({
        $and: Object.entries(restFilters).map(([field, value]) => ({
            [field]: value
        }))
     })
    }
    const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {}
    const [bookings, total] = await Promise.all([
        Booking.find({...whereCondition}).populate('user').populate('business').populate('request','message').populate('category','title icon').populate('subCategories','title').sort({[sortBy]: sortOrder}).skip(skip).limit(limit),
        Booking.countDocuments({...whereCondition})
    ])
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: bookings
    }
  }
  


export const DashboardService = {
    getGeneralStats,
    getCategoryStats,
    getSubCategoryStatsByCategory,
    getBookingStats,
    getCustomerStats,
    getAllUser,
    getBusinessStats,
    getAllBookings
}
