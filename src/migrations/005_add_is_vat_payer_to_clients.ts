import { db } from '../config/database';

export const addIsVatPayerToClients = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if column already exists
    db.all("PRAGMA table_info(clients)", (err, columns: any[]) => {
      if (err) {
        console.error('Error checking clients table schema:', err);
        return reject(err);
      }

      const columnExists = columns.some(col => col.name === 'is_vat_payer');

      if (!columnExists) {
        console.log('Adding is_vat_payer column to clients table...');
        db.run(
          "ALTER TABLE clients ADD COLUMN is_vat_payer INTEGER DEFAULT 1",
          (alterErr) => {
            if (alterErr) {
              console.error('Error adding is_vat_payer column:', alterErr);
              return reject(alterErr);
            }
            console.log('is_vat_payer column added successfully');
            resolve();
          }
        );
      } else {
        console.log('is_vat_payer column already exists in clients table');
        resolve();
      }
    });
  });
};
