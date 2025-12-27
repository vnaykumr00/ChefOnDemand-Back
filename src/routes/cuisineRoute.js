import { Router } from 'express';
import { getAllCuisines } from '../controllers/cuisineController.js';

const router = Router();

router.get('/', getAllCuisines);

export default router;
