import { db } from '../config/database';

export const addThemeColumn = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if column exists first
      db.all("PRAGMA table_info(users)", (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const themeColumnExists = rows.some(row => row.name === 'theme');
        
        if (!themeColumnExists) {
          db.run(
            "ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'",
            (err) => {
              if (err) {
                reject(err);
              } else {
                console.log('Migration 003: Added theme column to users table');
                resolve();
              }
            }
          );
        } else {
          console.log('Migration 003: Theme column already exists');
          resolve();
        }
      });
    });
  });
};
