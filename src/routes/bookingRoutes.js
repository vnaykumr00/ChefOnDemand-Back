
import express from 'express';
import bookingController from '../controllers/bookingController.js';

const router = express.Router();

// Create a new booking
router.post('/', bookingController.createBooking);

// Get bookings for a chef
router.get('/chef/:chefId', bookingController.getChefBookings);

// Get bookings for a customer
router.get('/customer/:customerId', bookingController.getCustomerBookings);

// Get single booking
router.get('/:bookingId', bookingController.getBookingById);

// Update booking status
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

// Report an issue with the booking
router.post('/:bookingId/report-issue', bookingController.reportIssue);

export default router;
