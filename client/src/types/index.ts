export interface User {
  id: number;
  email: string;
  company_name: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
  zip?: string;
  phone?: string;
  bank_account?: string;
  logo?: string;
  stamp?: string;
}

export interface Client {
  id?: number;
  company_name: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export interface Invoice {
  id?: number;
  user_id?: number;
  client_id: number;
  client_name?: string;
  type: 'invoice' | 'received';
  number?: string;
  issue_date: string;
  due_date: string;
  tax_date?: string;
  subtotal?: number;
  vat_rate?: number;
  vat_amount?: number;
  total?: number;
  currency?: string;
  status?: 'unpaid' | 'paid' | 'cancelled' | 'overdue';
  notes?: string;
  items?: InvoiceItem[];
}

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  category?: string;
  amount: number;
  vat_amount?: number;
  description?: string;
  transaction_date: string;
  invoice_id?: number;
}

export interface Statistics {
  income: {
    total: number;
    vat: number;
    count: number;
  };
  expenses: {
    total: number;
    vat: number;
    count: number;
  };
  profit: number;
  invoices: any[];
}
