import React, { useEffect, useState } from 'react';
import { statsService } from '../../services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await statsService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Načítání...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card warning">
          <h3>Nezaplacené faktury po splatnosti</h3>
          <div className="stat-value">{dashboardData?.overdueInvoices?.count || 0}</div>
          <div className="stat-label">Celkem: {dashboardData?.overdueInvoices?.amount?.toFixed(2) || 0} Kč</div>
        </div>
      </div>

      <div className="chart-section">
        <h2>Přehled příjmů a výdajů (aktuální rok)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData?.monthlyChart || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#4caf50" name="Příjmy" />
            <Bar dataKey="expenses" fill="#f44336" name="Výdaje" />
          </BarChart>
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
                <td>{invoice.type === 'invoice' ? 'Faktura' : invoice.type === 'proforma' ? 'Záloha' : 'Nabídka'}</td>
                <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
                <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
                <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
                <td>
                  <span className={`status-badge ${invoice.status}`}>
                    {invoice.status === 'paid' ? 'Zaplaceno' : invoice.status === 'unpaid' ? 'Nezaplaceno' : invoice.status}
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
