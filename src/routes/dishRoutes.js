import { Router } from 'express';
import { getAllDishes, getDishById, createDish, updateDish, deleteDish } from '../controllers/dishController.js';

const router = Router();

router.get('/', getAllDishes);
router.get('/:dishId', getDishById);
router.post('/', createDish);
router.put('/:dishId', updateDish);
router.delete('/:dishId', deleteDish);

export default router;
