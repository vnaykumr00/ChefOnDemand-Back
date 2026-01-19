import { Router } from 'express';
import { verifySupabaseToken } from '../middleware/auth.middleware.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-order', verifySupabaseToken, createOrder);
router.post('/verify-payment', verifySupabaseToken, verifyPayment);

export default router;
