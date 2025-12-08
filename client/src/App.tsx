import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import InvoiceList from './components/Invoices/InvoiceList';
import ClientList from './components/Clients/ClientList';
import TransactionList from './components/Transactions/TransactionList';
import Statistics from './components/Statistics/Statistics';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Načítání...</div>;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><ClientList /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><TransactionList /></PrivateRoute>} />
          <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
