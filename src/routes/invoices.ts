import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
