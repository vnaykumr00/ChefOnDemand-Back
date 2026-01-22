import { Router } from 'express';
import multer from 'multer';
import { getAllDishes, getDishById, createDish, updateDish, deleteDish } from '../controllers/dishController.js';
import { verifySupabaseToken } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 } // 500kb limit
});

router.get('/', getAllDishes);
router.get('/:dishId', getDishById);
router.post('/', verifySupabaseToken, upload.single('image'), createDish);
router.put('/:dishId', verifySupabaseToken, upload.single('image'), updateDish);
router.delete('/:dishId', verifySupabaseToken, deleteDish);

export default router;
