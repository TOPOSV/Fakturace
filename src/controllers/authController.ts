import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const register = (req: Request, res: Response) => {
  const { email, password, company_name, ico, dic, address, city, zip, phone, bank_account } = req.body;

  if (!email || !password || !company_name) {
    return res.status(400).json({ error: 'Email, password, and company name are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO users (email, password, company_name, ico, dic, address, city, zip, phone, bank_account)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [email, hashedPassword, company_name, ico, dic, address, city, zip, phone, bank_account], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(500).json({ error: 'Failed to register user' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign({ userId: this.lastID }, secret, { expiresIn: '7d' });
    res.status(201).json({ token, userId: this.lastID, message: 'User registered successfully' });
  });
};

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user: any) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
    res.json({ token, userId: user.id, email: user.email, company_name: user.company_name });
  });
};

export const getProfile = (req: AuthRequest, res: Response) => {
  db.get('SELECT id, email, company_name, ico, dic, address, city, zip, country, phone, bank_account FROM users WHERE id = ?', 
    [req.userId], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
};

export const updateProfile = (req: AuthRequest, res: Response) => {
  const { company_name, ico, dic, address, city, zip, phone, bank_account } = req.body;

  const sql = `
    UPDATE users 
    SET company_name = ?, ico = ?, dic = ?, address = ?, city = ?, zip = ?, phone = ?, bank_account = ?
    WHERE id = ?
  `;

  db.run(sql, [company_name, ico, dic, address, city, zip, phone, bank_account, req.userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
};
