import express from 'express';
import { BookingController } from './booking.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enum/user';
import { BookingValidations } from './booking.validation';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER),validateRequest(BookingValidations.create), BookingController.createBooking);
router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER), BookingController.getAllBookings);
router.get('/growth', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS), BookingController.bookingGrowth);
router.get('/conversion-growth', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS), BookingController.bookingConversionGrowth);
router.get('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER), BookingController.getSingleBooking);
router.patch('/:id', auth(USER_ROLES.BUSINESS), BookingController.updateBooking);
router.delete('/:id', auth(USER_ROLES.ADMIN, USER_ROLES.BUSINESS, USER_ROLES.USER), BookingController.deleteBooking);

export const BookingRoutes = router;
