import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light';
    
    UPDATE users 
    SET theme = 'light' 
    WHERE theme IS NULL;
  `);
  console.log('Migration 003: Added theme column to users table');
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS theme;
  `);
  console.log('Migration 003: Removed theme column from users table');
};
