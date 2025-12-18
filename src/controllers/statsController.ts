import { Response } from 'express';
import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getStatistics = (req: AuthRequest, res: Response) => {
  const { period, year, includeVat } = req.query;
  const includeVatBool = includeVat === 'true';

  const czechMonths = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  // Get all invoices for the specified year (excluding deleted)
  const invoiceSql = `
    SELECT 
      id,
      type,
      issue_date,
      total,
      vat_amount
    FROM invoices
    WHERE user_id = ? AND strftime('%Y', issue_date) = ? AND deleted_at IS NULL
    ORDER BY issue_date ASC
  `;

  db.all(invoiceSql, [req.userId, year], (err, invoices: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

    const chartData: any[] = [];

    if (period === 'month') {
      // Generate monthly data for the year
      const monthlyIncome: { [key: number]: number } = {};
      const monthlyExpenses: { [key: number]: number } = {};

      invoices.forEach((invoice) => {
        const month = new Date(invoice.issue_date).getMonth() + 1;
        const amount = includeVatBool ? invoice.total : (invoice.total - (invoice.vat_amount || 0));

        if (invoice.type === 'invoice') {
          // Vydaná faktura = příjem (income)
          monthlyIncome[month] = (monthlyIncome[month] || 0) + amount;
        } else if (invoice.type === 'received') {
          // Přijatá faktura = výdaj (expense)
          monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
        }
      });

      for (let month = 1; month <= 12; month++) {
        const income = monthlyIncome[month] || 0;
        const expenses = monthlyExpenses[month] || 0;
        chartData.push({
          period: czechMonths[month - 1],
          income,
          expenses,
          difference: income - expenses
        });
      }
    } else if (period === 'quarter') {
      // Generate quarterly data
      const quarterlyIncome: { [key: number]: number } = {};
      const quarterlyExpenses: { [key: number]: number } = {};

      invoices.forEach((invoice) => {
        const month = new Date(invoice.issue_date).getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        const amount = includeVatBool ? invoice.total : (invoice.total - (invoice.vat_amount || 0));

        if (invoice.type === 'invoice') {
          // Vydaná faktura = příjem (income)
          quarterlyIncome[quarter] = (quarterlyIncome[quarter] || 0) + amount;
        } else if (invoice.type === 'received') {
          // Přijatá faktura = výdaj (expense)
          quarterlyExpenses[quarter] = (quarterlyExpenses[quarter] || 0) + amount;
        }
      });

      for (let quarter = 1; quarter <= 4; quarter++) {
        const income = quarterlyIncome[quarter] || 0;
        const expenses = quarterlyExpenses[quarter] || 0;
        chartData.push({
          period: `Q${quarter}`,
          income,
          expenses,
          difference: income - expenses
        });
      }
    } else if (period === 'year') {
      // Generate yearly data for last 5 years
      const currentYear = parseInt(year as string);
      const yearlyIncome: { [key: number]: number } = {};
      const yearlyExpenses: { [key: number]: number } = {};

      // Fetch all invoices from last 5 years (excluding deleted)
      const yearRangeSql = `
        SELECT 
          issue_date,
          type,
          total,
          vat_amount
        FROM invoices
        WHERE user_id = ? AND strftime('%Y', issue_date) >= ? AND strftime('%Y', issue_date) <= ? AND deleted_at IS NULL
      `;

      db.all(yearRangeSql, [req.userId, (currentYear - 4).toString(), currentYear.toString()], (err, allInvoices: any[]) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch yearly data' });
        }

        allInvoices.forEach((invoice) => {
          const invoiceYear = new Date(invoice.issue_date).getFullYear();
          const amount = includeVatBool ? invoice.total : (invoice.total - (invoice.vat_amount || 0));

          if (invoice.type === 'invoice') {
            // Vydaná faktura = příjem (income)
            yearlyIncome[invoiceYear] = (yearlyIncome[invoiceYear] || 0) + amount;
          } else if (invoice.type === 'received') {
            // Přijatá faktura = výdaj (expense)
            yearlyExpenses[invoiceYear] = (yearlyExpenses[invoiceYear] || 0) + amount;
          }
        });

        for (let y = currentYear - 4; y <= currentYear; y++) {
          const income = yearlyIncome[y] || 0;
          const expenses = yearlyExpenses[y] || 0;
          chartData.push({
            period: y.toString(),
            income,
            expenses,
            difference: income - expenses
          });
        }

        // Get recent invoices
        getRecentInvoices(req, res, chartData);
      });
      return; // Exit early for yearly view since it has nested callback
    }

    // For monthly and quarterly, get recent invoices
    getRecentInvoices(req, res, chartData);
  });
};

const getRecentInvoices = (req: AuthRequest, res: Response, chartData: any[]) => {
  const recentSql = `
    SELECT i.*, c.company_name as client_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ? AND i.deleted_at IS NULL
    ORDER BY i.created_at DESC
    LIMIT 10
  `;

  db.all(recentSql, [req.userId], (err, recentInvoices) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent invoices' });
    }

    res.json({
      chartData,
      recentInvoices
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

    // Get overdue invoices (excluding deleted)
    const overdueSql = `
      SELECT COUNT(*) as count, SUM(total) as amount
      FROM invoices
      WHERE user_id = ? AND status = 'unpaid' AND due_date < date('now') AND deleted_at IS NULL
    `;

    db.get(overdueSql, [req.userId], (err, overdueData: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch overdue invoices' });
      }

      // Get recent invoices (excluding deleted)
      const recentSql = `
        SELECT i.*, c.company_name as client_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ? AND i.deleted_at IS NULL
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
