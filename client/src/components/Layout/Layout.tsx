import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          {user?.logo ? (
            <Link to="/dashboard" className="brand-with-logo">
              <img src={user.logo} alt={user.company_name} className="brand-logo" />
              <span>Fakturace</span>
            </Link>
          ) : (
            <Link to="/dashboard">📊 Fakturace</Link>
          )}
        </div>
        <div className="navbar-menu">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/invoices">Faktury</Link>
          <Link to="/clients">Klienti</Link>
          <Link to="/transactions">Transakce</Link>
          <Link to="/statistics">Statistiky</Link>
        </div>
        <div className="navbar-user">
          <span>{user?.company_name}</span>
          <Link to="/settings" className="btn-settings" title="Nastavení">⚙️</Link>
          <button onClick={handleLogout} className="btn-logout">Odhlásit se</button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
