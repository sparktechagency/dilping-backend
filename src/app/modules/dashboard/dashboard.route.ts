import express from "express";
import { DashboardController } from "./dashboard.controller";
import auth from "../../middleware/auth";
import { USER_ROLES } from "../../../enum/user";


const router = express.Router()

router.get('/stats', auth(USER_ROLES.ADMIN), DashboardController.getGeneralStats)
router.get('/category-stats', auth(USER_ROLES.ADMIN), DashboardController.getCategoryStats)
router.get('/subcategory-stats/:categoryId', auth(USER_ROLES.ADMIN), DashboardController.getSubCategoryStatsByCategory)
router.get('/booking-stats/:categoryId', auth(USER_ROLES.ADMIN), DashboardController.getBookingStats)
router.get('/customer-stats', auth(USER_ROLES.ADMIN), DashboardController.getCustomerStats)
router.get('/users', auth(USER_ROLES.ADMIN), DashboardController.getAllUser)
router.get('/business-stats', auth(USER_ROLES.ADMIN), DashboardController.getBusinessStats)
router.get('/bookings', auth(USER_ROLES.ADMIN), DashboardController.getAllBookings)
export const DashboardRoutes = router