import { sendOtpService, verifyOtpService } from '../services/otpRequestService.js';
import { findUserByPhone } from '../services/userService.js';

export const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        // Add existence check layer
        const { data: userExists } = await findUserByPhone(phone);
        if (userExists) {
            return res.status(400).json({
                message: 'This phone number is already registered with another account.',
                code: 'PHONE_ALREADY_EXISTS'
            });
        }

        const result = await sendOtpService(phone);
        res.json(result);
    } catch (error) {
        console.error('OTP Send Error:', error);
        res.status(500).json({ message: error.message || 'Failed to send OTP' });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

        const result = await verifyOtpService(phone, otp);
        res.json(result);
    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(400).json({ message: error.message || 'Verification failed' });
    }
};
