import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services';
import './Invoices.css';

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Faktury, Zálohy a Nabídky</h1>
        <button className="btn-primary">+ Nová faktura</button>
      </div>
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
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.number}</td>
              <td>{invoice.client_name}</td>
              <td>{invoice.type === 'invoice' ? 'Faktura' : invoice.type === 'proforma' ? 'Záloha' : 'Nabídka'}</td>
              <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
              <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
              <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
              <td><span className={`status-badge ${invoice.status}`}>{invoice.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
