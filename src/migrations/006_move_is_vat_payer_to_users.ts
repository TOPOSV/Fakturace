import { db } from '../config/database';

export const moveIsVatPayerToUsers = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if column already exists in users table
    db.all("PRAGMA table_info(users)", (err, columns: any[]) => {
      if (err) {
        console.error('Error checking users table schema:', err);
        return reject(err);
      }

      const columnExists = columns.some(col => col.name === 'is_vat_payer');

      if (!columnExists) {
        console.log('Adding is_vat_payer column to users table...');
        db.run(
          "ALTER TABLE users ADD COLUMN is_vat_payer INTEGER DEFAULT 1",
          (alterErr) => {
            if (alterErr) {
              console.error('Error adding is_vat_payer column to users:', alterErr);
              return reject(alterErr);
            }
            console.log('is_vat_payer column added successfully to users table');
            resolve();
          }
        );
      } else {
        console.log('is_vat_payer column already exists in users table');
        resolve();
      }
    });
  });
};
