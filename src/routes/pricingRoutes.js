import express from 'express';
import pricingController from '../controllers/pricingController.js';

const router = express.Router();

router.get('/', pricingController.getPricingRules);

export default router;
