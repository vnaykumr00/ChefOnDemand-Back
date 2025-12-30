import { Router } from 'express';
import { verifySupabaseToken } from '../middleware/auth.middleware.js';
import {
  registerChef,
  getRegistrationDishes,
  getChefProfile,
  setAvailability,
  deleteAvailability,
  getAvailability,
  getChefPublicProfile,
} from '../controllers/chefController.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Chef route is working!' });
});
router.post('/register', verifySupabaseToken, registerChef);
router.get('/dishes', verifySupabaseToken, getRegistrationDishes);
router.get('/profile/:chefId', verifySupabaseToken, getChefProfile);
router.post('/availability', verifySupabaseToken, setAvailability);
router.delete('/availability', verifySupabaseToken, deleteAvailability);
router.get('/availability', verifySupabaseToken, getAvailability);
router.get('/public/:chefId', verifySupabaseToken, getChefPublicProfile);


export default router;
