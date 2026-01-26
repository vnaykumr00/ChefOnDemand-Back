
import bookingService from '../services/bookingService.js';
import { supabase } from '../config/supabase.js';

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

        // Fetch Platform Charges to deduct for Chef View
        let platformCharge = 0;
        try {
            const { data: pricingData } = await supabase
                .from('pricing_rules')
                .select('Value')
                .eq('RuleName', 'PLATFORM_CHARGES_PER_DISH')
                .single();
            if (pricingData) {
                platformCharge = Number(pricingData.Value);
            }
        } catch (e) {
            console.warn("Chef Bookings: Failed to fetch platform charges", e);
        }

        // Deduct charges from the amounts distinct to the Chef
        const chefBookings = bookings.map(booking => {
            let numUniqueDishes = 0;
            if (booking.DishIds && Array.isArray(booking.DishIds)) {
                // Count unique dishes that have at least 1 quantity
                numUniqueDishes = booking.DishIds.filter(d => (Number(d.quantity) || 0) > 0).length;
            }

            const totalDeduction = numUniqueDishes * platformCharge;

            // Deep clone to modify
            const modifiedBooking = { ...booking };

            // Adjust Total Amount
            modifiedBooking.TotalAmount = (Number(modifiedBooking.TotalAmount) || 0) - totalDeduction;

            // Adjust Pricing Details if present
            if (modifiedBooking.PricingDetails) {
                const details = { ...modifiedBooking.PricingDetails };
                if (details.foodSubtotal) {
                    details.foodSubtotal = (Number(details.foodSubtotal) || 0) - totalDeduction;
                }
                modifiedBooking.PricingDetails = details;
            }

            return modifiedBooking;
        });

        res.json(chefBookings);
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

        // If user is a Chef, show net price (Total - Platform Fees)
        if (req.user && req.user.role === 'chef') {
            let platformCharge = 0;
            try {
                const { data: pricingData } = await supabase
                    .from('pricing_rules')
                    .select('Value')
                    .eq('RuleName', 'PLATFORM_CHARGES_PER_DISH')
                    .single();
                if (pricingData) {
                    platformCharge = Number(pricingData.Value);
                }
            } catch (e) {
                console.warn("Chef Booking Detail: Failed to fetch platform charges", e);
            }

            let numUniqueDishes = 0;
            if (booking.DishIds && Array.isArray(booking.DishIds)) {
                numUniqueDishes = booking.DishIds.filter(d => (Number(d.quantity) || 0) > 0).length;
            }

            const totalDeduction = numUniqueDishes * platformCharge;

            // Adjust Total Amount
            const modifiedBooking = { ...booking };
            modifiedBooking.TotalAmount = (Number(modifiedBooking.TotalAmount) || 0) - totalDeduction;

            // Adjust Pricing Details if present
            if (modifiedBooking.PricingDetails) {
                const details = { ...modifiedBooking.PricingDetails };
                if (details.foodSubtotal) {
                    details.foodSubtotal = (Number(details.foodSubtotal) || 0) - totalDeduction;
                }
                modifiedBooking.PricingDetails = details;
            }
            res.json(modifiedBooking);
        } else {
            // Customer or other: show full price
            res.json(booking);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const reportIssue = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        // Fetch booking to get customer and chef IDs
        const booking = await bookingService.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const issue = await bookingService.createReportedIssue({
            BookingId: bookingId,
            CustomerId: booking.CustomerId,
            ChefId: booking.ChefId,
            IssueDescription: description,
            Status: 'OPEN'
        });

        // Update booking status to cancelled as per user request
        await bookingService.updateBookingStatus(bookingId, 'cancelled');

        res.status(201).json(issue);
    } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({ error: 'Failed to report issue' });
    }
};

export default {
    createBooking,
    getChefBookings,
    getCustomerBookings,
    getBookingById,
    updateBookingStatus,
    reportIssue
};
