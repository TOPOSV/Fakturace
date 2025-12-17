import { Router } from 'express';
import { register, login, getProfile, updateProfile, updateTheme } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', apiLimiter, authenticateToken, getProfile);
router.put('/profile', apiLimiter, authenticateToken, updateProfile);
router.post('/update-theme', apiLimiter, authenticateToken, updateTheme);

export default router;
