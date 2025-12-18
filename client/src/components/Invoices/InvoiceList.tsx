import React, { useEffect, useState, useCallback } from 'react';
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
  const [copyingInvoice, setCopyingInvoice] = useState<any>(null);
  
  // Always default to 'all' to show all invoices on initial load
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'issued', 'received', 'advance'
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'paid', 'unpaid', 'overdue', 'archive'
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

  const loadInvoices = useCallback(async () => {
    try {
      // Include deleted invoices when viewing archive
      const includeDeleted = statusFilter === 'archive';
      const params = includeDeleted ? { include_deleted: 'true' } : {};
      const data = await invoiceService.getAll(params);
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    // Load invoices on mount and when statusFilter changes (for archive filter)
    loadInvoices();
  }, [loadInvoices]); // Depend on loadInvoices which depends on statusFilter

  const applyFilters = useCallback(() => {
    let filtered = [...invoices];
    
    // Apply type filter (Vydané/Přijaté faktury)
    if (typeFilter === 'issued') {
      filtered = filtered.filter(inv => inv.type === 'invoice');
    } else if (typeFilter === 'received') {
      filtered = filtered.filter(inv => inv.type === 'received');
    } else if (typeFilter === 'advance') {
      filtered = filtered.filter(inv => inv.type === 'advance');
    }
    
    // Apply status filter (Uhrazeno/Neuhrazeno/Po splatnosti/Archiv)
    if (statusFilter === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'paid');
    } else if (statusFilter === 'unpaid') {
      filtered = filtered.filter(inv => inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'draft');
    } else if (statusFilter === 'overdue') {
      filtered = filtered.filter(inv => inv.status === 'overdue');
    } else if (statusFilter === 'archive') {
      // Show both cancelled and deleted invoices in archive
      filtered = filtered.filter(inv => inv.status === 'cancelled' || inv.deleted_at != null);
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
  }, [invoices, filters, typeFilter, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters, typeFilter, statusFilter]);

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
      const response = await invoiceService.update(invoice.id, { status: 'paid' });
      
      // Check if a regular invoice was auto-created from advance invoice
      if (response.regularInvoiceId) {
        alert(`Faktura uhrazena. Běžná faktura úspěšně vytvořena (ID: ${response.regularInvoiceId})`);
      }
      
      loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Nepodařilo se označit fakturu jako uhrazenou');
    }
  };

  const handleCreateRegularFromAdvance = async (invoice: any) => {
    const confirmed = await showConfirmDialog(`Vytvořit běžnou fakturu ze zálohové faktury ${invoice.number}?`);
    if (!confirmed) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/invoices/${invoice.id}/create-regular`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert(`Běžná faktura úspěšně vytvořena (ID: ${response.data.regularInvoiceId})`);
      loadInvoices();
    } catch (error: any) {
      console.error('Failed to create regular invoice:', error);
      alert(error.response?.data?.error || 'Nepodařilo se vytvořit běžnou fakturu');
    }
  };

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setCopyingInvoice(null);
    setShowForm(true);
  };

  const handleCopy = async (invoice: any) => {
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
      
      // Prepare copy data (without id, number, dates, status)
      const copyData = {
        client_id: fullInvoice.client_id,
        type: fullInvoice.type,
        prices_include_vat: fullInvoice.prices_include_vat,
        payment_method: fullInvoice.payment_method,
        items: fullInvoice.items, // Pre-fill items
      };
      
      setCopyingInvoice(copyData);
      setEditingInvoice(null);
      setShowForm(true);
    } catch (error) {
      console.error('Failed to copy invoice:', error);
      alert('Nepodařilo se zkopírovat fakturu');
    }
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

  const handleExportTaxDocument = async (invoice: any) => {
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
      
      // Generate and download PDF as tax document
      await generateInvoicePDF(fullInvoice, userData, true);
    } catch (error) {
      console.error('Failed to export tax document:', error);
      alert('Nepodařilo se exportovat daňový doklad do PDF');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setCopyingInvoice(null);
  };

  const handleSuccess = () => {
    loadInvoices();
  };

  const getStatusText = (invoice: any) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'KONCEPT',
      'sent': 'ODESLÁNO',
      'paid': 'UHRAZENO',
      'unpaid': 'NEUHRAZENO',
      'overdue': 'PO SPLATNOSTI',
      'cancelled': 'ZRUŠENO',
      'deleted': 'SMAZÁNO'
    };
    
    // Check if invoice is deleted
    if (invoice.deleted_at) {
      return statusMap['deleted'];
    }
    
    return (invoice.status && statusMap[invoice.status]) || (invoice.status ? invoice.status.toUpperCase() : '');
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
          className={`quick-filter-btn ${typeFilter === 'all' && statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
        >
          VŠE
        </button>
        <button 
          className={`quick-filter-btn ${typeFilter === 'issued' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'issued' ? 'all' : 'issued')}
        >
          VYDANÉ FAKTURY
        </button>
        <button 
          className={`quick-filter-btn ${typeFilter === 'received' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'received' ? 'all' : 'received')}
        >
          PŘIJATÉ FAKTURY
        </button>
        <button 
          className={`quick-filter-btn ${typeFilter === 'advance' ? 'active' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'advance' ? 'all' : 'advance')}
        >
          ZÁLOHOVÉ FAKTURY
        </button>
        <button 
          className={`quick-filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
        >
          UHRAZENO
        </button>
        <button 
          className={`quick-filter-btn ${statusFilter === 'unpaid' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid')}
        >
          NEUHRAZENO
        </button>
        <button 
          className={`quick-filter-btn ${statusFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
        >
          PO SPLATNOSTI
        </button>
        <button 
          className={`quick-filter-btn ${statusFilter === 'archive' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'archive' ? 'all' : 'archive')}
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
                  <td>
                    {invoice.type === 'invoice' ? 'Vydaná faktura' : 
                     invoice.type === 'received' ? 'Přijatá faktura' : 
                     invoice.type === 'advance' ? 'Zálohová faktura' : invoice.type}
                    {invoice.type === 'advance' && invoice.linked_invoice_id && (
                      <span style={{ display: 'block', fontSize: '0.85em', color: '#666' }}>
                        (Vytvořena běžná faktura)
                      </span>
                    )}
                  </td>
                  <td>{new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</td>
                  <td>{invoice.total?.toFixed(2)} {invoice.currency}</td>
                  <td>{subtotal?.toFixed(2)} {invoice.currency}</td>
                  <td><span className={`status-badge ${invoice.deleted_at ? 'deleted' : invoice.status}`}>{getStatusText(invoice)}</span></td>
                  <td className="action-buttons">
                    {/* Disable most actions for deleted invoices, allow only PDF export */}
                    {!invoice.deleted_at && (
                      <>
                        {/* Show "Create Regular Invoice" button for advance invoices that are paid and don't have linked invoice */}
                        {invoice.type === 'advance' && invoice.status === 'paid' && !invoice.linked_invoice_id && (
                          <button
                            onClick={() => handleCreateRegularFromAdvance(invoice)}
                            className="action-btn create-regular-btn"
                            title="Vytvořit běžnou fakturu"
                            style={{ backgroundColor: '#28a745', fontSize: '1.1em' }}
                          >
                            📝
                          </button>
                        )}
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
                          onClick={() => handleCopy(invoice)}
                          className="action-btn copy-btn"
                          title="Kopírovat fakturu"
                        >
                          📋
                        </button>
                        {/* Show "Print Tax Document" button for paid advance invoices - BEFORE PDF export */}
                        {invoice.type === 'advance' && invoice.status === 'paid' && (
                          <button
                            onClick={() => handleExportTaxDocument(invoice)}
                            className="action-btn tax-doc-btn"
                            title="Tisk daňového dokladu k přijaté platbě"
                            style={{ backgroundColor: '#007bff', fontSize: '1.1em' }}
                          >
                            🧾
                          </button>
                        )}
                      </>
                    )}
                    {/* PDF export is always available, even for deleted invoices */}
                    <button
                      onClick={() => handleExportPDF(invoice)}
                      className="action-btn pdf-btn"
                      title="Export do PDF"
                    >
                      📄
                    </button>
                    {/* Delete button only for non-deleted invoices */}
                    {!invoice.deleted_at && (
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="action-btn delete-btn"
                        title="Smazat"
                      >
                        🗑️
                      </button>
                    )}
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
          copyData={copyingInvoice}
        />
      )}
    </div>
  );
};

export default InvoiceList;
