import { db } from '../config/database';

export const addIbanField = () => {
  return new Promise<void>((resolve, reject) => {
    db.run(`
      ALTER TABLE users ADD COLUMN iban TEXT
    `, (err) => {
      if (err) {
        // Check if column already exists
        if (err.message.includes('duplicate column name')) {
          console.log('IBAN column already exists');
          resolve();
        } else {
          console.error('Error adding IBAN column:', err);
          reject(err);
        }
      } else {
        console.log('IBAN column added successfully');
        resolve();
      }
    });
  });
};
