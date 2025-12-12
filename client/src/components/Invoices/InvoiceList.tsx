import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services';
import InvoiceForm from './InvoiceForm';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import axios from 'axios';
import './Invoices.css';

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [filters, setFilters] = useState({
    number: '',
    client_name: '',
    type: '',
    status: '',
    issue_date: '',
    due_date: '',
    amount_min: '',
    amount_max: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, filters, quickFilter]);

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
    
    // Apply quick filter first
    if (quickFilter === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'paid');
    } else if (quickFilter === 'unpaid') {
      filtered = filtered.filter(inv => inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'draft');
    } else if (quickFilter === 'overdue') {
      filtered = filtered.filter(inv => inv.status === 'overdue');
    } else if (quickFilter === 'archive') {
      filtered = filtered.filter(inv => inv.status === 'cancelled');
    }
    
    // Apply column filters
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
    if (filters.issue_date) {
      filtered = filtered.filter(inv => 
        new Date(inv.issue_date).toLocaleDateString('cs-CZ').includes(filters.issue_date)
      );
    }
    if (filters.due_date) {
      filtered = filtered.filter(inv => 
        new Date(inv.due_date).toLocaleDateString('cs-CZ').includes(filters.due_date)
      );
    }
    if (filters.amount_min) {
      filtered = filtered.filter(inv => inv.total >= parseFloat(filters.amount_min));
    }
    if (filters.amount_max) {
      filtered = filtered.filter(inv => inv.total <= parseFloat(filters.amount_max));
    }
    
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const showConfirmDialog = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'custom-dialog-overlay';
      dialog.innerHTML = `
        <div class="custom-dialog">
          <div class="custom-dialog-header">Potvrzení</div>
          <div class="custom-dialog-body">${message}</div>
          <div class="custom-dialog-footer">
            <button class="custom-dialog-btn custom-dialog-btn-cancel">Zrušit</button>
            <button class="custom-dialog-btn custom-dialog-btn-confirm">Potvrdit</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
      
      const confirmBtn = dialog.querySelector('.custom-dialog-btn-confirm');
      const cancelBtn = dialog.querySelector('.custom-dialog-btn-cancel');
      
      confirmBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(true);
      });
      
      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(false);
      });
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmDialog('Opravdu chcete smazat tuto fakturu?');
    if (!confirmed) return;
    
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
    
    const confirmed = await showConfirmDialog(`Označit fakturu ${invoice.number} jako uhrazenou?`);
    if (!confirmed) return;
    
    try {
      await invoiceService.update(invoice.id, { status: 'paid' });
      loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Nepodařilo se označit fakturu jako uhrazenou');
    }
  };

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleExportPDF = async (invoice: any) => {
    try {
      // Fetch full invoice details with items
      const fullInvoiceResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/invoices/${invoice.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      const fullInvoice = fullInvoiceResponse.data;
      
      // Fetch user profile data
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      const userData = userResponse.data;
      
      // Generate and download PDF
      await generateInvoicePDF(fullInvoice, userData);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Nepodařilo se exportovat fakturu do PDF');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleSuccess = () => {
    loadInvoices();
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'KONCEPT',
      'sent': 'ODESLÁNO',
      'paid': 'UHRAZENO',
      'unpaid': 'NEUHRAZENO',
      'overdue': 'PO SPLATNOSTI',
      'cancelled': 'ZRUŠENO'
    };
    return statusMap[status] || status.toUpperCase();
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

      <div className="quick-filters">
        <button 
          className={`quick-filter-btn ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          VŠE
        </button>
        <button 
          className={`quick-filter-btn ${quickFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setQuickFilter('paid')}
        >
          UHRAZENO
        </button>
        <button 
          className={`quick-filter-btn ${quickFilter === 'unpaid' ? 'active' : ''}`}
          onClick={() => setQuickFilter('unpaid')}
        >
          NEUHRAZENO
        </button>
        <button 
          className={`quick-filter-btn ${quickFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setQuickFilter('overdue')}
        >
          PO SPLATNOSTI
        </button>
        <button 
          className={`quick-filter-btn ${quickFilter === 'archive' ? 'active' : ''}`}
          onClick={() => setQuickFilter('archive')}
        >
          ARCHIV
        </button>
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
            <th>Bez DPH</th>
            <th>Stav</th>
            <th>Akce</th>
          </tr>

        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                Žádné faktury nenalezeny
              </td>
            </tr>
          ) : (
            currentItems.map((invoice) => {
              const subtotal = invoice.subtotal || (invoice.total / 1.21);
              return (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{invoice.client_name}</td>
                  <td>{invoice.type === 'invoice' ? 'Faktura' : invoice.type === 'proforma' ? 'Záloha' : 'Nabídka'}</td>
                  <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
                  <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
                  <td>{subtotal?.toFixed(2)} {invoice.currency}</td>
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
                      onClick={() => handleExportPDF(invoice)}
                      className="action-btn pdf-btn"
                      title="Export do PDF"
                    >
                      📄
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
              );
            })
          )}
        </tbody>
      </table>

      <div className="table-footer">
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
      </div>

      {showForm && (
        <InvoiceForm
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
          invoice={editingInvoice}
        />
      )}
    </div>
  );
};

export default InvoiceList;
