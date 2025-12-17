import { db } from '../config/database';

/**
 * Migration to add logo and stamp columns to users table
 * Run this migration to update existing databases
 */
export const addLogoAndStampColumns = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if columns already exist
      db.all("PRAGMA table_info(users)", (err, columns: any[]) => {
        if (err) {
          console.error('Error checking table structure:', err);
          reject(err);
          return;
        }

        const hasLogo = columns.some(col => col.name === 'logo');
        const hasStamp = columns.some(col => col.name === 'stamp');

        if (!hasLogo) {
          db.run('ALTER TABLE users ADD COLUMN logo TEXT', (err) => {
            if (err) {
              console.error('Error adding logo column:', err);
            } else {
              console.log('✓ Added logo column to users table');
            }
          });
        } else {
          console.log('✓ Logo column already exists');
        }

        if (!hasStamp) {
          db.run('ALTER TABLE users ADD COLUMN stamp TEXT', (err) => {
            if (err) {
              console.error('Error adding stamp column:', err);
            } else {
              console.log('✓ Added stamp column to users table');
            }
          });
        } else {
          console.log('✓ Stamp column already exists');
        }

        resolve(true);
      });
    });
  });
};
