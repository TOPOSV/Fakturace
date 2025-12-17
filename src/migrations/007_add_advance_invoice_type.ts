import { db } from '../config/database';

/**
 * Migration to add 'advance' invoice type and related fields
 * - Adds 'advance' to the invoice type CHECK constraint
 * - Adds linked_invoice_id field to link advance invoices to regular invoices
 * - Adds auto_create_regular_invoice field for automatic invoice creation
 */
export const migrateAddAdvanceInvoiceType = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Begin transaction
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Failed to begin transaction:', err);
          return reject(err);
        }

        // Create new table with updated constraint and new fields
        db.run(`
          CREATE TABLE IF NOT EXISTS invoices_new (
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
            status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'cancelled', 'overdue')),
            notes TEXT,
            linked_invoice_id INTEGER,
            auto_create_regular_invoice INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (linked_invoice_id) REFERENCES invoices(id)
          )
        `, (err) => {
          if (err) {
            console.error('Failed to create new table:', err);
            db.run('ROLLBACK');
            return reject(err);
          }

          // Copy data from old table to new table
          db.run(`
            INSERT INTO invoices_new (id, user_id, client_id, type, number, issue_date, due_date, 
                                      tax_date, subtotal, vat_rate, vat_amount, total, currency, 
                                      status, notes, created_at)
            SELECT id, user_id, client_id, type, number, issue_date, due_date, 
                   tax_date, subtotal, vat_rate, vat_amount, total, currency, 
                   status, notes, created_at
            FROM invoices
          `, (err) => {
            if (err) {
              console.error('Failed to copy data:', err);
              db.run('ROLLBACK');
              return reject(err);
            }

            // Drop old table
            db.run('DROP TABLE invoices', (err) => {
              if (err) {
                console.error('Failed to drop old table:', err);
                db.run('ROLLBACK');
                return reject(err);
              }

              // Rename new table
              db.run('ALTER TABLE invoices_new RENAME TO invoices', (err) => {
                if (err) {
                  console.error('Failed to rename table:', err);
                  db.run('ROLLBACK');
                  return reject(err);
                }

                // Commit transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Failed to commit transaction:', err);
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  console.log('Migration completed: Added advance invoice type with linked_invoice_id and auto_create_regular_invoice fields');
                  resolve(true);
                });
              });
            });
          });
        });
      });
    });
  });
};
