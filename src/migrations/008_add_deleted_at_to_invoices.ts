import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`
      ALTER TABLE invoices ADD COLUMN deleted_at DATETIME DEFAULT NULL
    `, (err) => {
      if (err) {
        console.error('Error adding deleted_at column:', err);
        reject(err);
      } else {
        console.log('Added deleted_at column to invoices table');
        resolve();
      }
    });
  });
};

export const down = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // SQLite doesn't support DROP COLUMN easily, so we'd need to recreate the table
    // For simplicity, we'll just log that this migration can't be easily reversed
    console.log('Reverting deleted_at column migration is not supported in SQLite without recreating the table');
    resolve();
  });
};
