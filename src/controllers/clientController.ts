import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { lookupICO } from '../utils/helpers';

export const getClients = (req: AuthRequest, res: Response) => {
  const sql = 'SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC';
  
  db.all(sql, [req.userId], (err, clients) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
    res.json(clients);
  });
};

export const getClient = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM clients WHERE id = ? AND user_id = ?', [id, req.userId], (err, client) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch client' });
    }
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  });
};

export const createClient = (req: AuthRequest, res: Response) => {
  const { company_name, ico, dic, address, city, zip, country, email, phone, is_vat_payer } = req.body;

  if (!company_name) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const sql = `
    INSERT INTO clients (user_id, company_name, ico, dic, address, city, zip, country, email, phone, is_vat_payer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const vatPayer = is_vat_payer !== undefined ? (is_vat_payer ? 1 : 0) : 1;

  db.run(sql, [req.userId, company_name, ico, dic, address, city, zip, country, email, phone, vatPayer], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create client' });
    }
    res.status(201).json({ id: this.lastID, message: 'Client created successfully' });
  });
};

export const updateClient = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { company_name, ico, dic, address, city, zip, country, email, phone, is_vat_payer } = req.body;

  const sql = `
    UPDATE clients 
    SET company_name = ?, ico = ?, dic = ?, address = ?, city = ?, zip = ?, country = ?, email = ?, phone = ?, is_vat_payer = ?
    WHERE id = ? AND user_id = ?
  `;

  const vatPayer = is_vat_payer !== undefined ? (is_vat_payer ? 1 : 0) : 1;

  db.run(sql, [company_name, ico, dic, address, city, zip, country, email, phone, vatPayer, id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update client' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client updated successfully' });
  });
};

export const deleteClient = (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  db.run('DELETE FROM clients WHERE id = ? AND user_id = ?', [id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete client' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  });
};

export const lookupClientByICO = async (req: AuthRequest, res: Response) => {
  const { ico } = req.params;

  try {
    const data = await lookupICO(ico);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup ICO' });
  }
};
