import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { addLogoAndStampColumns } from './migrations/addLogoStamp';
import { migrateAddReceivedInvoiceType } from './migrations/001_add_received_invoice_type';
import { addIbanField } from './migrations/002_add_iban_field';
import { addThemeColumn } from './migrations/003_add_theme_column';
import { addInvoiceNumberingFormat } from './migrations/004_add_invoice_numbering_format';
import { addIsVatPayerToClients } from './migrations/005_add_is_vat_payer_to_clients';
import { moveIsVatPayerToUsers } from './migrations/006_move_is_vat_payer_to_users';
import { migrateAddAdvanceInvoiceType } from './migrations/007_add_advance_invoice_type';

import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import invoiceRoutes from './routes/invoices';
import transactionRoutes from './routes/transactions';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Initialize database and run migrations
initializeDatabase();
setTimeout(async () => {
  try {
    await addLogoAndStampColumns();
    await migrateAddReceivedInvoiceType();
    await addIbanField();
    await addThemeColumn();
    await addInvoiceNumberingFormat();
    await addIsVatPayerToClients();
    await moveIsVatPayerToUsers();
    await migrateAddAdvanceInvoiceType();
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
  }
}, 1000); // Wait for DB initialization

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fakturace API is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
