import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import bookingService from '../services/bookingService.js';

dotenv.config();

const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('❌ Razorpay keys are missing in .env');
        return null;
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export const createOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;


        const razorpay = getRazorpayInstance();
        if (!razorpay) throw new Error('Razorpay keys not configured');

        if (!amount || !bookingId) {
            return res.status(400).json({ message: 'Amount and BookingId are required' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${bookingId}`,
        };

        const order = await razorpay.orders.create(options);

        // Update transaction/booking with order id if needed, 
        // or just return to frontend to complete payment
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            amount // We need amount passed back or store it in order/booking. Best to pass it for simplicity if secure enough for this step, or fetch from order. 
            // Note: In production, verify amount against order ID. 
        } = req.body;



        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error('❌ RAZORPAY_KEY_SECRET is missing in .env');
            throw new Error('Razorpay secret not configured');
        }

        const expectedSign = crypto
            .createHmac("sha256", keySecret)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {


            // 1. Create Transaction Record
            const { error: transError } = await supabase
                .from('transactions')
                .insert({
                    BookingId: bookingId,
                    Amount: amount, // Ensure frontend sends this or fetch it
                    Status: 'paid',
                    PaymentMethod: 'razorpay',
                    TransactionRef: razorpay_payment_id,
                    Commission: (amount * 0.10).toFixed(2),
                    ChefPayout: (amount * 0.90).toFixed(2),
                });

            if (transError) {
                console.error('❌ Error creating transaction:', transError);
                // Even if transaction logging fails, we might still want to complete booking? 
                // Ideally we should rollback or retry. For now throwing.
                throw transError;
            }

            // 2. Update Booking Status -> This also generates "OTP" in bookingService
            await bookingService.updateBookingStatus(bookingId, 'PAYMENT_COMPLETED');

            res.json({ message: "Payment verified successfully", success: true });
        } else {
            console.error('❌ Invalid payment signature');
            res.status(400).json({ message: "Invalid signature", success: false });
        }
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
