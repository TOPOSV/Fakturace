import { Router } from 'express';
import { getStatistics, getDashboard } from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/statistics', getStatistics);
router.get('/dashboard', getDashboard);

export default router;
