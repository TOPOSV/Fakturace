import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createRegularFromAdvance,
} from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.post('/:id/create-regular', createRegularFromAdvance);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
