import { db } from '../config/database';

/**
 * Migration to add deleted_at column to invoices table for soft delete functionality
 */
export const addDeletedAtToInvoices = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, check if migration is already applied
      db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'`, (err, row: any) => {
        if (err) {
          console.error('Failed to check table schema:', err);
          return reject(err);
        }

        // Check if the migration is already applied
        if (row && row.sql && row.sql.includes('deleted_at')) {
          console.log('Migration already applied: deleted_at column exists');
          return resolve(true);
        }

        // Add deleted_at column to invoices table
        db.run(`
          ALTER TABLE invoices ADD COLUMN deleted_at DATETIME DEFAULT NULL
        `, (err) => {
          if (err) {
            console.error('Error adding deleted_at column:', err);
            return reject(err);
          }
          
          console.log('Migration completed: Added deleted_at column to invoices table');
          resolve(true);
        });
      });
    });
  });
};
