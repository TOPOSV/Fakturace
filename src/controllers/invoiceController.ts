import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateInvoiceNumber } from '../utils/helpers';

export const getInvoices = (req: AuthRequest, res: Response) => {
  const { type, status } = req.query;
  let sql = `
    SELECT i.*, c.company_name as client_name 
    FROM invoices i 
    LEFT JOIN clients c ON i.client_id = c.id 
    WHERE i.user_id = ?
  `;
  const params: any[] = [req.userId];

  if (type) {
    sql += ' AND i.type = ?';
    params.push(type);
  }

  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY i.created_at DESC';

  db.all(sql, params, (err, invoices) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }
    res.json(invoices);
  });
};

export const getInvoice = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  db.get(
    `SELECT i.*, c.company_name as client_name, c.address as client_address, 
     c.city as client_city, c.zip as client_zip, c.ico as client_ico, c.dic as client_dic
     FROM invoices i 
     LEFT JOIN clients c ON i.client_id = c.id 
     WHERE i.id = ? AND i.user_id = ?`,
    [id, req.userId],
    (err, invoice: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch invoice' });
      }
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Fetch invoice items
      db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [id], (err, items) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch invoice items' });
        }
        res.json({ ...invoice, items });
      });
    }
  );
};

export const createInvoice = (req: AuthRequest, res: Response) => {
  const {
    client_id,
    type,
    issue_date,
    due_date,
    tax_date,
    items,
    notes,
    currency = 'CZK',
  } = req.body;

  if (!client_id || !type || !issue_date || !due_date || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Calculate totals
  let subtotal = 0;
  let totalVat = 0;

  items.forEach((item: any) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemVat = (itemSubtotal * (item.vat_rate || 21)) / 100;
    subtotal += itemSubtotal;
    totalVat += itemVat;
  });

  const total = subtotal + totalVat;

  // Generate invoice number
  const year = new Date(issue_date).getFullYear();
  
  db.get(
    'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND type = ? AND strftime("%Y", issue_date) = ?',
    [req.userId, type, year.toString()],
    (err, result: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to generate invoice number' });
      }

      const sequence = (result?.count || 0) + 1;
      const invoiceNumber = generateInvoiceNumber(type, year, sequence);

      const sql = `
        INSERT INTO invoices (user_id, client_id, type, number, issue_date, due_date, tax_date, 
                             subtotal, vat_rate, vat_amount, total, currency, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [req.userId, client_id, type, invoiceNumber, issue_date, due_date, tax_date, 
         subtotal, 21, totalVat, total, currency, notes],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create invoice' });
          }

          const invoiceId = this.lastID;

          // Insert invoice items
          const itemSql = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          let itemsInserted = 0;
          items.forEach((item: any) => {
            const itemTotal = item.quantity * item.unit_price * (1 + (item.vat_rate || 21) / 100);
            db.run(
              itemSql,
              [invoiceId, item.description, item.quantity, item.unit_price, item.vat_rate || 21, itemTotal],
              (err) => {
                if (err) {
                  console.error('Error inserting item:', err);
                }
                itemsInserted++;
                if (itemsInserted === items.length) {
                  res.status(201).json({
                    id: invoiceId,
                    number: invoiceNumber,
                    message: 'Invoice created successfully',
                  });
                }
              }
            );
          });
        }
      );
    }
  );
};

export const updateInvoice = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const sql = 'UPDATE invoices SET status = ?, notes = ? WHERE id = ? AND user_id = ?';

  db.run(sql, [status, notes, id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update invoice' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice updated successfully' });
  });
};

export const deleteInvoice = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  db.run('DELETE FROM invoices WHERE id = ? AND user_id = ?', [id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete invoice' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  });
};
