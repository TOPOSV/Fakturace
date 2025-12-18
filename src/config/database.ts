import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './fakturace.db';

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

export const initializeDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        company_name TEXT NOT NULL,
        ico TEXT,
        dic TEXT,
        address TEXT,
        city TEXT,
        zip TEXT,
        country TEXT DEFAULT 'Česká republika',
        bank_account TEXT,
        phone TEXT,
        logo TEXT,
        stamp TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clients table
    db.run(`
      CREATE TABLE IF NOT EXISTS clients (
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
    `);

    // Invoices table (for issued and received invoices)
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
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
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (linked_invoice_id) REFERENCES invoices(id)
      )
    `);

    // Invoice items table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        vat_rate REAL DEFAULT 21.0,
        total REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);

    // Transactions table (income and expenses)
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT,
        amount REAL NOT NULL,
        vat_amount REAL DEFAULT 0,
        description TEXT,
        transaction_date DATE NOT NULL,
        invoice_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      )
    `);

    console.log('Database tables initialized');
  });
};

export default db;
