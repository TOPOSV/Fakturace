import { Router } from 'express';
import { getStatistics, getDashboard } from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/statistics', getStatistics);
router.get('/dashboard', getDashboard);

export default router;
