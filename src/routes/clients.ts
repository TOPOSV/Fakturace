import { Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  lookupClientByICO,
} from '../controllers/clientController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.get('/lookup/:ico', lookupClientByICO);

export default router;
