import { db } from '../config/database';

export const removeIsVatPayerFromClients = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if column exists
    db.all("PRAGMA table_info(clients)", (err, columns: any[]) => {
      if (err) {
        console.error('Error checking clients table schema:', err);
        return reject(err);
      }

      const columnExists = columns.some(col => col.name === 'is_vat_payer');

      if (columnExists) {
        console.log('Removing is_vat_payer column from clients table...');
        
        // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
        db.serialize(() => {
          // Create new table without is_vat_payer
          db.run(`
            CREATE TABLE clients_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              company_name TEXT NOT NULL,
              ico TEXT,
              dic TEXT,
              address TEXT,
              city TEXT,
              zip TEXT,
              country TEXT DEFAULT 'Česká republika',
              email TEXT,
              phone TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
          `, (createErr) => {
            if (createErr) {
              console.error('Error creating clients_new table:', createErr);
              return reject(createErr);
            }

            // Copy data from old table to new (excluding is_vat_payer)
            db.run(`
              INSERT INTO clients_new (id, user_id, company_name, ico, dic, address, city, zip, country, email, phone, created_at)
              SELECT id, user_id, company_name, ico, dic, address, city, zip, country, email, phone, created_at
              FROM clients
            `, (copyErr) => {
              if (copyErr) {
                console.error('Error copying data to clients_new:', copyErr);
                return reject(copyErr);
              }

              // Drop old table
              db.run('DROP TABLE clients', (dropErr) => {
                if (dropErr) {
                  console.error('Error dropping old clients table:', dropErr);
                  return reject(dropErr);
                }

                // Rename new table to clients
                db.run('ALTER TABLE clients_new RENAME TO clients', (renameErr) => {
                  if (renameErr) {
                    console.error('Error renaming clients_new to clients:', renameErr);
                    return reject(renameErr);
                  }

                  console.log('is_vat_payer column removed successfully from clients table');
                  resolve();
                });
              });
            });
          });
        });
      } else {
        console.log('is_vat_payer column does not exist in clients table');
        resolve();
      }
    });
  });
};
