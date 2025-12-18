import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateInvoiceNumber } from '../utils/helpers';

export const getInvoices = (req: AuthRequest, res: Response) => {
  const { type, status, include_deleted } = req.query;
  let sql = `
    SELECT i.*, c.company_name as client_name 
    FROM invoices i 
    LEFT JOIN clients c ON i.client_id = c.id 
    WHERE i.user_id = ?
  `;
  const params: any[] = [req.userId];

  // Exclude deleted invoices by default (unless include_deleted is true)
  if (include_deleted !== 'true') {
    sql += ' AND i.deleted_at IS NULL';
  }

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
     c.city as client_city, c.zip as client_zip, c.ico as client_ico, c.dic as client_dic, u.is_vat_payer as client_is_vat_payer
     FROM invoices i 
     LEFT JOIN clients c ON i.client_id = c.id 
     LEFT JOIN users u ON i.user_id = u.id
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
    auto_create_regular_invoice = 0,
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

  // Get user's invoice numbering format preference
  db.get('SELECT invoice_numbering_format FROM users WHERE id = ?', [req.userId], (err, userSettings: any) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user settings' });
    }

    const numberingFormat = userSettings?.invoice_numbering_format || 'year_4';
    
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
        const invoiceNumber = generateInvoiceNumber(type, year, sequence, numberingFormat);

        const sql = `
          INSERT INTO invoices (user_id, client_id, type, number, issue_date, due_date, tax_date, 
                               subtotal, vat_rate, vat_amount, total, currency, notes, auto_create_regular_invoice)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          sql,
          [req.userId, client_id, type, invoiceNumber, issue_date, due_date, tax_date, 
           subtotal, 21, totalVat, total, currency, notes, auto_create_regular_invoice],
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
            let hasError = false;
            
            items.forEach((item: any) => {
              const itemTotal = item.quantity * item.unit_price * (1 + (item.vat_rate || 21) / 100);
              db.run(
                itemSql,
                [invoiceId, item.description, item.quantity, item.unit_price, item.vat_rate || 21, itemTotal],
                (err) => {
                  if (err) {
                    console.error('Error inserting item:', err);
                    if (!hasError) {
                      hasError = true;
                      return res.status(500).json({ error: 'Failed to insert invoice items' });
                    }
                    return;
                  }
                  itemsInserted++;
                  if (itemsInserted === items.length && !hasError) {
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
  });
};

export const updateInvoice = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  // First get the invoice to check if it's an advance invoice with auto_create enabled
  db.get('SELECT * FROM invoices WHERE id = ? AND user_id = ?', [id, req.userId], (err, invoice: any) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch invoice' });
    }
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const sql = 'UPDATE invoices SET status = ?, notes = ? WHERE id = ? AND user_id = ?';

    db.run(sql, [status, notes, id, req.userId], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update invoice' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // If this is an advance invoice being marked as paid and auto_create is enabled
      if (invoice.type === 'advance' && status === 'paid' && invoice.auto_create_regular_invoice === 1 && !invoice.linked_invoice_id) {
        // Update invoice object with new status for consistency
        invoice.status = status;
        createRegularInvoiceFromAdvance(invoice, req.userId!, (err, regularInvoiceId) => {
          if (err) {
            console.error('Failed to auto-create regular invoice:', err);
            return res.json({ 
              message: 'Invoice updated successfully, but failed to create regular invoice',
              warning: 'Failed to create regular invoice automatically'
            });
          }
          
          // Update the advance invoice to link to the regular invoice
          db.run('UPDATE invoices SET linked_invoice_id = ? WHERE id = ?', [regularInvoiceId, id], (err) => {
            if (err) {
              console.error('Failed to link invoices:', err);
            }
            res.json({ 
              message: 'Invoice updated successfully and regular invoice created',
              regularInvoiceId 
            });
          });
        });
      } else {
        res.json({ message: 'Invoice updated successfully' });
      }
    });
  });
};

// Helper function to create a regular invoice from an advance invoice
const createRegularInvoiceFromAdvance = (advanceInvoice: any, userId: number, callback: (err: any, invoiceId?: number) => void) => {
  // Get the advance invoice items
  db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [advanceInvoice.id], (err, items: any[]) => {
    if (err) {
      return callback(err);
    }

    // Get user's invoice numbering format preference
    db.get('SELECT invoice_numbering_format FROM users WHERE id = ?', [userId], (err, userSettings: any) => {
      if (err) {
        return callback(err);
      }

      const numberingFormat = userSettings?.invoice_numbering_format || 'year_4';
      const year = new Date().getFullYear();
      
      // Generate invoice number for regular invoice
      db.get(
        'SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND type = ? AND strftime("%Y", issue_date) = ?',
        [userId, 'invoice', year.toString()],
        (err, result: any) => {
          if (err) {
            return callback(err);
          }

          const sequence = (result?.count || 0) + 1;
          const invoiceNumber = generateInvoiceNumber('invoice', year, sequence, numberingFormat);
          const today = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          // Set status to 'paid' if advance invoice was paid
          const invoiceStatus = advanceInvoice.status === 'paid' ? 'paid' : 'unpaid';
          
          const sql = `
            INSERT INTO invoices (user_id, client_id, type, number, issue_date, due_date, tax_date, 
                                 subtotal, vat_rate, vat_amount, total, currency, notes, status, linked_invoice_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const notesText = `Běžná faktura vytvořená ze zálohové faktury č. ${advanceInvoice.number}${advanceInvoice.notes ? '\n' + advanceInvoice.notes : ''}`;

          db.run(
            sql,
            [userId, advanceInvoice.client_id, 'invoice', invoiceNumber, today, dueDate, today,
             advanceInvoice.subtotal, advanceInvoice.vat_rate, advanceInvoice.vat_amount, 
             advanceInvoice.total, advanceInvoice.currency, notesText, invoiceStatus, advanceInvoice.id],
            function (err) {
              if (err) {
                return callback(err);
              }

              const regularInvoiceId = this.lastID;

              // Copy invoice items and add paid advance line item
              const itemSql = `
                INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total)
                VALUES (?, ?, ?, ?, ?, ?)
              `;

              // All items to insert (original items + paid advance line item if paid)
              const allItems = [...items];
              
              // Add a line item showing the paid advance with negative value if advance was paid
              if (advanceInvoice.status === 'paid') {
                // Calculate the negative unit price from the advance invoice total
                // We need to reverse calculate: total with VAT -> unit price without VAT
                const negativeTotal = -advanceInvoice.total;
                const negativeSubtotal = -advanceInvoice.subtotal;
                const negativeVatAmount = negativeTotal - negativeSubtotal;
                
                allItems.push({
                  description: `Uhrazená záloha č. ${advanceInvoice.number}`,
                  quantity: 1,
                  unit_price: negativeSubtotal,
                  vat_rate: advanceInvoice.vat_rate,
                  total: negativeTotal
                });
              }

              // If no items, call callback immediately
              if (allItems.length === 0) {
                return callback(null, regularInvoiceId);
              }

              let itemsInserted = 0;
              let hasError = false;
              
              allItems.forEach((item: any) => {
                db.run(
                  itemSql,
                  [regularInvoiceId, item.description, item.quantity, item.unit_price, item.vat_rate, item.total],
                  (err) => {
                    if (err) {
                      console.error('Error copying item:', err);
                      if (!hasError) {
                        hasError = true;
                        return callback(err);
                      }
                      return;
                    }
                    itemsInserted++;
                    if (itemsInserted === allItems.length && !hasError) {
                      callback(null, regularInvoiceId);
                    }
                  }
                );
              });
            }
          );
        }
      );
    });
  });
};

// Endpoint to manually create a regular invoice from an advance invoice
export const createRegularFromAdvance = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get the advance invoice
  db.get('SELECT * FROM invoices WHERE id = ? AND user_id = ? AND type = ?', [id, req.userId, 'advance'], (err, invoice: any) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch advance invoice' });
    }
    if (!invoice) {
      return res.status(404).json({ error: 'Advance invoice not found' });
    }
    if (invoice.linked_invoice_id) {
      return res.status(400).json({ error: 'Regular invoice already created for this advance invoice' });
    }

    createRegularInvoiceFromAdvance(invoice, req.userId!, (err, regularInvoiceId) => {
      if (err) {
        console.error('Failed to create regular invoice:', err);
        return res.status(500).json({ error: 'Failed to create regular invoice' });
      }
      
      // Update the advance invoice to link to the regular invoice
      db.run('UPDATE invoices SET linked_invoice_id = ? WHERE id = ?', [regularInvoiceId, id], (err) => {
        if (err) {
          console.error('Failed to link invoices:', err);
          return res.status(500).json({ error: 'Invoice created but failed to link' });
        }
        res.status(201).json({ 
          message: 'Regular invoice created successfully from advance invoice',
          regularInvoiceId 
        });
      });
    });
  });
};

export const deleteInvoice = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // First check if this invoice has linked invoices (is referenced by other invoices)
  db.get(
    'SELECT COUNT(*) as count FROM invoices WHERE linked_invoice_id = ? AND user_id = ?',
    [id, req.userId],
    (err, result: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check invoice dependencies' });
      }

      if (result && result.count > 0) {
        return res.status(400).json({ 
          error: 'Nelze smazat fakturu, která má navázané další faktury. Nejprve smažte závislé faktury.' 
        });
      }

      // Soft delete: set deleted_at timestamp instead of removing the record
      db.run(
        'UPDATE invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [id, req.userId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete invoice' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Invoice not found or already deleted' });
          }
          res.json({ message: 'Invoice deleted successfully' });
        }
      );
    }
  );
};
