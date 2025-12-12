import React, { useState } from 'react';
import { statsService } from '../../services';

const Statistics: React.FC = () => {
  const [period, setPeriod] = useState('year');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const data = await statsService.getStatistics({ period, year });
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStatistics();
  }, [period, year, loadStatistics]);

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <h1>Statistiky</h1>
      <div className="stats-filters">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="month">Měsíc</option>
          <option value="quarter">Kvartál</option>
          <option value="year">Rok</option>
        </select>
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card success">
            <h3>Příjmy</h3>
            <div className="stat-value">{stats.income?.total?.toFixed(2) || 0} Kč</div>
            <div className="stat-label">Počet: {stats.income?.count || 0}</div>
          </div>
          <div className="stat-card danger">
            <h3>Výdaje</h3>
            <div className="stat-value">{stats.expenses?.total?.toFixed(2) || 0} Kč</div>
            <div className="stat-label">Počet: {stats.expenses?.count || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Zisk</h3>
            <div className="stat-value">{stats.profit?.toFixed(2) || 0} Kč</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
