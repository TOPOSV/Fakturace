import { db } from '../config/database';

/**
 * Migration to fix the status CHECK constraint to include 'draft' and 'sent' statuses
 * SQLite doesn't support modifying CHECK constraints directly, so we need to recreate the table
 */
export const fixInvoiceStatusConstraint = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check current table schema to see if it needs updating
      db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='invoices'`, (err, row: any) => {
        if (err) {
          console.error('Failed to check table schema:', err);
          return reject(err);
        }

        // Check if the constraint already includes 'draft' and 'sent'
        if (row && row.sql && row.sql.includes("'draft'") && row.sql.includes("'sent'")) {
          console.log('Migration already applied: status constraint includes draft and sent');
          return resolve(true);
        }

        // If migration is not applied, we need to recreate the table
        // First, disable foreign key constraints temporarily
        db.run('PRAGMA foreign_keys=OFF', (err) => {
          if (err) {
            console.error('Failed to disable foreign keys:', err);
            return reject(err);
          }

          db.run(`BEGIN TRANSACTION`, (err) => {
            if (err) {
              console.error('Failed to begin transaction:', err);
              db.run('PRAGMA foreign_keys=ON');
              return reject(err);
            }

            // Create a new table with the updated CHECK constraint
            db.run(`
              CREATE TABLE invoices_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('invoice', 'received', 'proforma', 'quote', 'advance')),
                number TEXT NOT NULL,
                issue_date DATE NOT NULL,
                due_date DATE NOT NULL,
                tax_date DATE,
                subtotal REAL NOT NULL,
                vat_rate REAL DEFAULT 21.0,
                vat_amount REAL NOT NULL,
                total REAL NOT NULL,
                currency TEXT DEFAULT 'CZK',
                status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'cancelled', 'overdue', 'draft', 'sent')),
                notes TEXT,
                linked_invoice_id INTEGER,
                auto_create_regular_invoice INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (client_id) REFERENCES clients(id),
                FOREIGN KEY (linked_invoice_id) REFERENCES invoices(id)
              )
            `, (err) => {
              if (err) {
                db.run('ROLLBACK');
                db.run('PRAGMA foreign_keys=ON');
                console.error('Error creating new invoices table:', err);
                return reject(err);
              }

              // Copy data from old table to new table with explicit column names
              db.run(`
                INSERT INTO invoices_new (
                  id, user_id, client_id, type, number, issue_date, due_date, tax_date,
                  subtotal, vat_rate, vat_amount, total, currency, status, notes,
                  linked_invoice_id, auto_create_regular_invoice, created_at, deleted_at
                )
                SELECT 
                  id, user_id, client_id, type, number, issue_date, due_date, tax_date,
                  subtotal, vat_rate, vat_amount, total, currency, status, notes,
                  linked_invoice_id, auto_create_regular_invoice, created_at, deleted_at
                FROM invoices
              `, (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  db.run('PRAGMA foreign_keys=ON');
                  console.error('Error copying data to new table:', err);
                  return reject(err);
                }

                // Drop the old table
                db.run('DROP TABLE invoices', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    db.run('PRAGMA foreign_keys=ON');
                    console.error('Error dropping old table:', err);
                    return reject(err);
                  }

                  // Rename new table to invoices
                  db.run('ALTER TABLE invoices_new RENAME TO invoices', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      db.run('PRAGMA foreign_keys=ON');
                      console.error('Error renaming table:', err);
                      return reject(err);
                    }

                    // Commit the transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('PRAGMA foreign_keys=ON');
                        console.error('Error committing transaction:', err);
                        return reject(err);
                      }

                      // Re-enable foreign key constraints
                      db.run('PRAGMA foreign_keys=ON', (err) => {
                        if (err) {
                          console.error('Error re-enabling foreign keys:', err);
                          return reject(err);
                        }

                        console.log('Migration completed: Fixed invoice status constraint to include draft and sent');
                        resolve(true);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
