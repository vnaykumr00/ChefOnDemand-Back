import { Router } from 'express';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';

const router = Router();

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

export default router;
