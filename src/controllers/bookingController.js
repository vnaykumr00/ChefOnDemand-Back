
import bookingService from '../services/bookingService.js';

const createBooking = async (req, res) => {
    try {
        const {
            customerId, chefId, serviceDate, location,
            totalAmount, dishIds, pricingDetails
        } = req.body;

        if (!customerId || !chefId || !serviceDate || !totalAmount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newBooking = await bookingService.createBooking({
            CustomerId: customerId,
            ChefId: chefId,
            ServiceDate: serviceDate,
            Location: location, // Should be JSON object
            TotalAmount: totalAmount,
            DishIds: dishIds, // Should be JSON array/object
            PricingDetails: pricingDetails || {}, // Store breakdown
            Status: 'ORDER_PLACED' // Explicitly set initial status
        });

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
};

const getChefBookings = async (req, res) => {
    try {
        const { chefId } = req.params;
        const bookings = await bookingService.getBookingsByChefId(chefId);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching chef bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, otp } = req.body;

        const allowedStatuses = [
            'pending', 'confirmed', 'cancelled', 'completed', // Legacy
            'ORDER_PLACED', 'CHEF_ACCEPTED', 'CHEF_ARRIVED',
            'INGREDIENTS_VERIFIED', 'ORDER_RECONFIRMED',
            'PAYMENT_COMPLETED', 'COOKING_STARTED',
            'COOKING_COMPLETED', 'ORDER_COMPLETED'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedBooking = await bookingService.updateBookingStatus(bookingId, status, otp);
        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: error.message || 'Failed to update booking status' });
    }
};


const getCustomerBookings = async (req, res) => {
    try {
        const { customerId } = req.params;
        const bookings = await bookingService.getBookingsByCustomerId(customerId);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await bookingService.getBookingById(bookingId);
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    createBooking,
    getChefBookings,
    getCustomerBookings,
    getBookingById,
    updateBookingStatus
};
