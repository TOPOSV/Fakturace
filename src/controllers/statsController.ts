import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getStatistics = (req: AuthRequest, res: Response) => {
  const { period, year, month, quarter } = req.query;

  let dateFilter = '';
  const params: any[] = [req.userId];

  if (period === 'month' && year && month) {
    dateFilter = "AND strftime('%Y-%m', transaction_date) = ?";
    params.push(`${year}-${String(month).padStart(2, '0')}`);
  } else if (period === 'quarter' && year && quarter) {
    const q = parseInt(quarter as string);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    dateFilter = `AND strftime('%Y', transaction_date) = ? AND CAST(strftime('%m', transaction_date) AS INTEGER) BETWEEN ? AND ?`;
    params.push(year, startMonth, endMonth);
  } else if (period === 'year' && year) {
    dateFilter = "AND strftime('%Y', transaction_date) = ?";
    params.push(year);
  }

  // Get income and expenses
  const sql = `
    SELECT 
      type,
      SUM(amount) as total_amount,
      SUM(vat_amount) as total_vat,
      COUNT(*) as count
    FROM transactions
    WHERE user_id = ? ${dateFilter}
    GROUP BY type
  `;

  db.all(sql, params, (err, transactionStats: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get invoice statistics
    const invoiceSql = `
      SELECT 
        type,
        status,
        COUNT(*) as count,
        SUM(total) as total_amount
      FROM invoices
      WHERE user_id = ? ${dateFilter.replace('transaction_date', 'issue_date')}
      GROUP BY type, status
    `;

    db.all(invoiceSql, params, (err, invoiceStats: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch invoice statistics' });
      }

      const income = transactionStats.find((t) => t.type === 'income') || { total_amount: 0, total_vat: 0, count: 0 };
      const expenses = transactionStats.find((t) => t.type === 'expense') || { total_amount: 0, total_vat: 0, count: 0 };

      res.json({
        income: {
          total: income.total_amount || 0,
          vat: income.total_vat || 0,
          count: income.count || 0,
        },
        expenses: {
          total: expenses.total_amount || 0,
          vat: expenses.total_vat || 0,
          count: expenses.count || 0,
        },
        profit: (income.total_amount || 0) - (expenses.total_amount || 0),
        invoices: invoiceStats,
      });
    });
  });
};

export const getDashboard = (req: AuthRequest, res: Response) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Get monthly statistics for the current year
  const monthlySql = `
    SELECT 
      strftime('%m', transaction_date) as month,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', transaction_date) = ?
    GROUP BY month, type
  `;

  db.all(monthlySql, [req.userId, currentYear.toString()], (err, monthlyData: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    // Get overdue invoices
    const overdueSql = `
      SELECT COUNT(*) as count, SUM(total) as amount
      FROM invoices
      WHERE user_id = ? AND status = 'unpaid' AND due_date < date('now')
    `;

    db.get(overdueSql, [req.userId], (err, overdueData: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch overdue invoices' });
      }

      // Get recent invoices
      const recentSql = `
        SELECT i.*, c.company_name as client_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
        LIMIT 10
      `;

      db.all(recentSql, [req.userId], (err, recentInvoices) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch recent invoices' });
        }

        // Process monthly data for chart
        const monthlyChart = Array.from({ length: 12 }, (_, i) => {
          const month = String(i + 1).padStart(2, '0');
          const income = monthlyData.find((d) => d.month === month && d.type === 'income')?.total || 0;
          const expenses = monthlyData.find((d) => d.month === month && d.type === 'expense')?.total || 0;
          return { month: i + 1, income, expenses };
        });

        res.json({
          monthlyChart,
          overdueInvoices: {
            count: overdueData?.count || 0,
            amount: overdueData?.amount || 0,
          },
          recentInvoices,
        });
      });
    });
  });
};
