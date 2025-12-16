import { db } from '../config/database';

export const addInvoiceNumberingFormat = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if the column already exists
    db.all("PRAGMA table_info(users)", [], (err, columns: any[]) => {
      if (err) {
        console.error('Error checking users table:', err);
        return reject(err);
      }

      const hasColumn = columns.some((col) => col.name === 'invoice_numbering_format');
      
      if (hasColumn) {
        console.log('invoice_numbering_format column already exists in users table');
        return resolve();
      }

      // Add invoice_numbering_format column
      db.run(
        "ALTER TABLE users ADD COLUMN invoice_numbering_format TEXT DEFAULT 'year_4'",
        [],
        (err) => {
          if (err) {
            console.error('Error adding invoice_numbering_format column:', err);
            return reject(err);
          }
          console.log('invoice_numbering_format column added to users table');
          resolve();
        }
      );
    });
  });
};
