import { Router } from 'express';
import { getAllDishes, getDishById } from '../controllers/dishController.js';

const router = Router();

router.get('/', getAllDishes);
router.get('/:dishId', getDishById);

export default router;
