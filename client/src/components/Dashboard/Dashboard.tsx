import React, { useEffect, useState } from 'react';
import { statsService } from '../../services';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import api from '../../services/api';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [includeVat, setIncludeVat] = useState<boolean>(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [period, year, includeVat]);

  const loadAvailableYears = async () => {
    try {
      const response = await api.get('/invoices');
      const invoices = response.data;
      
      // Extract unique years from invoice dates
      const years = new Set<number>();
      invoices.forEach((invoice: any) => {
        if (invoice.issue_date) {
          const invoiceYear = new Date(invoice.issue_date).getFullYear();
          years.add(invoiceYear);
        }
      });
      
      // Sort years in descending order
      const sortedYears = Array.from(years).sort((a, b) => b - a);
      
      // If no invoices, use current year
      if (sortedYears.length === 0) {
        sortedYears.push(new Date().getFullYear());
      }
      
      setAvailableYears(sortedYears);
      
      // Set year to first available year if current year not in list
      if (sortedYears.length > 0 && !sortedYears.includes(year)) {
        setYear(sortedYears[0]);
      }
    } catch (error) {
      console.error('Failed to load available years:', error);
      // Fallback to current year
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params = { period, year, includeVat };
      const data = await statsService.getStatistics(params);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' Kč';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.period}</p>
          <p className="tooltip-income">
            <span className="dot green"></span>
            Vydané faktury: <strong>{formatCurrency(data.income)}</strong>
          </p>
          <p className="tooltip-expense">
            <span className="dot red"></span>
            Přijaté faktury: <strong>{formatCurrency(data.expenses)}</strong>
          </p>
          <p className="tooltip-difference">
            <span className="dot blue"></span>
            Rozdíl: <strong>{formatCurrency(data.difference)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="loading">Načítání...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="chart-section">
        <div className="chart-header">
          <h2>Přehled fakturace</h2>
          <div className="chart-controls">
            <div className="control-group">
              <label>Období:</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="period-select">
                <option value="month">Měsíc</option>
                <option value="quarter">Kvartál</option>
                <option value="year">Rok</option>
              </select>
            </div>
            <div className="control-group">
              <label>Rok:</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="year-select">
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="control-group vat-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                />
                <span>Ceny s DPH</span>
              </label>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dashboardData?.chartData || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#43A047" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#43A047" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53935" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#E53935" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDifference" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis 
              dataKey="period" 
              stroke="#666"
              style={{ fontSize: '12px', fontWeight: 500 }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#43A047" 
              strokeWidth={3}
              dot={{ fill: '#43A047', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Vydané faktury"
              fill="url(#colorIncome)"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#E53935" 
              strokeWidth={3}
              dot={{ fill: '#E53935', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Přijaté faktury"
              fill="url(#colorExpense)"
            />
            <Line 
              type="monotone" 
              dataKey="difference" 
              stroke="#1E88E5" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#1E88E5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Rozdíl"
              fill="url(#colorDifference)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="recent-invoices">
        <h2>Poslední faktury</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Číslo</th>
              <th>Klient</th>
              <th>Typ</th>
              <th>Datum vystavení</th>
              <th>Splatnost</th>
              <th>Částka</th>
              <th>Stav</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData?.recentInvoices?.map((invoice: any) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>{invoice.client_name}</td>
                <td>{
                  invoice.type === 'invoice' ? 'Faktura' : 
                  invoice.type === 'received' ? 'Přijatá faktura' :
                  invoice.type === 'advance' ? 'Zálohová faktura' :
                  invoice.type === 'proforma' ? 'Záloha' : 
                  'Nabídka'
                }</td>
                <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
                <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
                <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
                <td>
                  <span className={`status-badge ${invoice.status}`}>
                    {invoice.status === 'paid' ? 'Zaplaceno' : 
                     invoice.status === 'unpaid' ? 'Nezaplaceno' : 
                     invoice.status === 'draft' ? 'Koncept' :
                     invoice.status === 'sent' ? 'Odesláno' :
                     invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
