import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getTransactions = (req: AuthRequest, res: Response) => {
  const { type, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params: any[] = [req.userId];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (startDate) {
    sql += ' AND transaction_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND transaction_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY transaction_date DESC';

  db.all(sql, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    res.json(transactions);
  });
};

export const createTransaction = (req: AuthRequest, res: Response) => {
  const { type, category, amount, vat_amount, description, transaction_date, invoice_id } = req.body;

  if (!type || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Type, amount, and transaction date are required' });
  }

  const sql = `
    INSERT INTO transactions (user_id, type, category, amount, vat_amount, description, transaction_date, invoice_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [req.userId, type, category, amount, vat_amount || 0, description, transaction_date, invoice_id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
    res.status(201).json({ id: this.lastID, message: 'Transaction created successfully' });
  });
};

export const updateTransaction = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, category, amount, vat_amount, description, transaction_date } = req.body;

  const sql = `
    UPDATE transactions 
    SET type = ?, category = ?, amount = ?, vat_amount = ?, description = ?, transaction_date = ?
    WHERE id = ? AND user_id = ?
  `;

  db.run(sql, [type, category, amount, vat_amount, description, transaction_date, id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update transaction' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated successfully' });
  });
};

export const deleteTransaction = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
};
