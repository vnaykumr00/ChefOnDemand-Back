
import express from 'express';
import bookingController from '../controllers/bookingController.js';

const router = express.Router();

// Create a new booking
router.post('/', bookingController.createBooking);

// Get bookings for a chef
router.get('/chef/:chefId', bookingController.getChefBookings);

// Update booking status
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

export default router;
