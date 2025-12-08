import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services';
import InvoiceForm from './InvoiceForm';
import './Invoices.css';

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    number: '',
    client_name: '',
    type: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, filters]);

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

  const applyFilters = () => {
    let filtered = [...invoices];
    
    if (filters.number) {
      filtered = filtered.filter(inv => 
        inv.number?.toLowerCase().includes(filters.number.toLowerCase())
      );
    }
    if (filters.client_name) {
      filtered = filtered.filter(inv => 
        inv.client_name?.toLowerCase().includes(filters.client_name.toLowerCase())
      );
    }
    if (filters.type) {
      filtered = filtered.filter(inv => inv.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }
    
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tuto fakturu?')) return;
    
    try {
      await invoiceService.delete(id);
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Nepodařilo se smazat fakturu');
    }
  };

  const handlePay = async (invoice: any) => {
    if (invoice.status === 'paid') {
      alert('Faktura je již uhrazena');
      return;
    }
    
    try {
      await invoiceService.update(invoice.id, { status: 'paid' });
      loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Nepodařilo se označit fakturu jako uhrazenou');
    }
  };

  const handleEdit = (invoice: any) => {
    // TODO: Implement edit functionality
    alert('Úprava faktury bude implementována v další verzi');
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleSuccess = () => {
    loadInvoices();
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Koncept',
      'sent': 'Odesláno',
      'paid': 'Zaplaceno',
      'overdue': 'Po splatnosti',
      'cancelled': 'Zrušeno'
    };
    return statusMap[status] || status;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Faktury, Zálohy a Nabídky</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nová faktura</button>
      </div>

      <div className="table-controls">
        <div>
          Zobrazit: 
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ marginLeft: '15px' }}>
            Celkem: {filteredInvoices.length} faktur
          </span>
        </div>
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
            <th>Akce</th>
          </tr>
          <tr className="filter-row">
            <th>
              <input
                type="text"
                placeholder="Filtr..."
                value={filters.number}
                onChange={(e) => handleFilterChange('number', e.target.value)}
                className="filter-input"
              />
            </th>
            <th>
              <input
                type="text"
                placeholder="Filtr..."
                value={filters.client_name}
                onChange={(e) => handleFilterChange('client_name', e.target.value)}
                className="filter-input"
              />
            </th>
            <th>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="filter-input"
              >
                <option value="">Vše</option>
                <option value="invoice">Faktura</option>
                <option value="proforma">Záloha</option>
                <option value="quote">Nabídka</option>
              </select>
            </th>
            <th></th>
            <th></th>
            <th></th>
            <th>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-input"
              >
                <option value="">Vše</option>
                <option value="draft">Koncept</option>
                <option value="sent">Odesláno</option>
                <option value="paid">Zaplaceno</option>
                <option value="overdue">Po splatnosti</option>
              </select>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                Žádné faktury nenalezeny
              </td>
            </tr>
          ) : (
            currentItems.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>{invoice.client_name}</td>
                <td>{invoice.type === 'invoice' ? 'Faktura' : invoice.type === 'proforma' ? 'Záloha' : 'Nabídka'}</td>
                <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
                <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
                <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
                <td><span className={`status-badge ${invoice.status}`}>{getStatusText(invoice.status)}</span></td>
                <td className="action-buttons">
                  <button
                    onClick={() => handlePay(invoice)}
                    className="action-btn pay-btn"
                    title="Uhradit"
                    disabled={invoice.status === 'paid'}
                  >
                    💳
                  </button>
                  <button
                    onClick={() => handleEdit(invoice)}
                    className="action-btn edit-btn"
                    title="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="action-btn delete-btn"
                    title="Smazat"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            « Předchozí
          </button>
          <span className="pagination-info">
            Strana {currentPage} z {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Další »
          </button>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default InvoiceList;
