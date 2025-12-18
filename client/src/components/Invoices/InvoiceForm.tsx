import React, { useState, useEffect } from 'react';
import { invoiceService, clientService } from '../../services';
import '../Clients/ClientForm.css';

interface InvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  invoice?: any;
  copyData?: any;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onSuccess, invoice, copyData }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  
  // Determine if we're copying (copyData provided) or editing (invoice provided)
  const sourceData = copyData || invoice;
  
  const [formData, setFormData] = useState({
    client_id: sourceData?.client_id?.toString() || '',
    type: sourceData?.type || 'invoice',
    issue_date: invoice?.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_date: invoice?.tax_date ? new Date(invoice.tax_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    currency: sourceData?.currency || 'CZK',
    notes: sourceData?.notes || '',
    auto_create_regular_invoice: sourceData?.auto_create_regular_invoice || 0,
  });
  const [items, setItems] = useState(
    sourceData?.items && sourceData.items.length > 0 
      ? sourceData.items 
      : [{ description: '', quantity: 1, unit_price: '', vat_rate: 21 }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    company_name: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    zip: '',
    email: '',
    phone: '',
  });
  const [lookingUpIco, setLookingUpIco] = useState(false);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(sourceData?.prices_include_vat !== undefined ? sourceData.prices_include_vat : true);

  useEffect(() => {
    loadClients();
    // If editing invoice (not copying), load its items
    if (invoice?.id && !copyData) {
      loadInvoiceItems(invoice.id);
    }
  }, [invoice, copyData]);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleClientSearch = (searchTerm: string) => {
    setClientSearch(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.company_name?.toLowerCase().includes(term) ||
      client.ico?.toLowerCase().includes(term) ||
      client.dic?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term)
    );
    setFilteredClients(filtered);
  };

  const loadInvoiceItems = async (invoiceId: number) => {
    try {
      const data = await invoiceService.getById(invoiceId);
      if (data.items && data.items.length > 0) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to load invoice items:', error);
    }
  };

  const handleLookupIco = async () => {
    if (!newClientData.ico) {
      alert('Zadejte IČO');
      return;
    }
    
    setLookingUpIco(true);
    try {
      const data = await clientService.lookupByICO(newClientData.ico);
      setNewClientData({
        ...newClientData,
        company_name: data.company_name || '',
        dic: data.dic || '',
        address: data.address || '',
        city: data.city || '',
        zip: data.zip || '',
      });
    } catch (error) {
      alert('Nepodařilo se načíst údaje z ARES');
    } finally {
      setLookingUpIco(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.company_name || !newClientData.ico) {
      alert('Vyplňte alespoň název firmy a IČO');
      return;
    }
    
    try {
      const newClient = await clientService.create(newClientData);
      await loadClients();
      setFormData({ ...formData, client_id: newClient.id.toString() });
      setShowNewClientForm(false);
      setNewClientData({
        company_name: '',
        ico: '',
        dic: '',
        address: '',
        city: '',
        zip: '',
        email: '',
        phone: '',
      });
    } catch (error) {
      alert('Nepodařilo se vytvořit klienta');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: '', vat_rate: 21 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_item: any, i: number) => i !== index));
    }
  };

  const calculateTotal = () => {
    let subtotal = 0;
    let vat = 0;
    
    items.forEach((item: any) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      const vatRate = parseFloat(item.vat_rate) || 21;
      
      if (pricesIncludeVat) {
        // If prices include VAT, remove VAT to get subtotal
        const priceWithoutVat = price / (1 + vatRate / 100);
        const itemSubtotal = qty * priceWithoutVat;
        subtotal += itemSubtotal;
        vat += itemSubtotal * (vatRate / 100);
      } else {
        const itemSubtotal = qty * price;
        subtotal += itemSubtotal;
        vat += itemSubtotal * (vatRate / 100);
      }
    });
    
    return { subtotal, vat, total: subtotal + vat };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.client_id) {
      setError('Vyberte klienta');
      setLoading(false);
      return;
    }

    if (items.some((item: any) => !item.description || !item.unit_price || parseFloat(item.unit_price) <= 0)) {
      setError('Vyplňte všechny položky faktury');
      setLoading(false);
      return;
    }

    try {
      const processedItems = items.map((item: any) => ({
        ...item,
        unit_price: parseFloat(item.unit_price) || 0,
        quantity: parseFloat(item.quantity) || 1,
      }));
      
      const data = {
        ...formData,
        client_id: parseInt(formData.client_id),
        items: processedItems,
      };
      
      if (invoice) {
        await invoiceService.update(invoice.id, data);
      } else {
        await invoiceService.create(data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || `Nepodařilo se ${invoice ? 'upravit' : 'vytvořit'} fakturu`);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2>{invoice ? 'Upravit fakturu' : 'Nová faktura'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Vyhledat klienta</label>
              <input
                type="text"
                placeholder="Hledat podle názvu, IČO, DIČ nebo emailu..."
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <label>Klient *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  style={{ flex: 1 }}
                >
                  <option value="">Vyberte klienta</option>
                  {filteredClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.company_name} {client.ico && `(IČO: ${client.ico})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Nový klient
                </button>
              </div>
            </div>
            <div className="form-group flex-1">
              <label>Typ *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="invoice">Vydaná faktura</option>
                <option value="received">Přijatá faktura</option>
                <option value="advance">Zálohová faktura</option>
              </select>
            </div>
          </div>

          {/* Show auto-create checkbox only for advance invoices */}
          {formData.type === 'advance' && (
            <div className="form-group" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', border: '1px solid #e0e0e0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.auto_create_regular_invoice === 1}
                  onChange={(e) => setFormData({ ...formData, auto_create_regular_invoice: e.target.checked ? 1 : 0 })}
                  style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                    Automaticky vytvořit běžnou fakturu po zaplacení
                  </span>
                  <small style={{ display: 'block', color: '#666', fontSize: '13px', lineHeight: '1.4' }}>
                    Po označení zálohové faktury jako zaplacené bude automaticky vytvořena běžná daňová faktura
                  </small>
                </div>
              </label>
            </div>
          )}

          {showNewClientForm && (
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Nový klient</h3>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>IČO *</label>
                  <input
                    type="text"
                    value={newClientData.ico}
                    onChange={(e) => setNewClientData({ ...newClientData, ico: e.target.value })}
                    placeholder="IČO"
                  />
                </div>
                <div className="form-group" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleLookupIco}
                    disabled={lookingUpIco}
                  >
                    {lookingUpIco ? 'Vyhledávám...' : 'Vyhledat v ARES'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Název firmy *</label>
                <input
                  type="text"
                  value={newClientData.company_name}
                  onChange={(e) => setNewClientData({ ...newClientData, company_name: e.target.value })}
                  placeholder="Název firmy"
                />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>DIČ</label>
                  <input
                    type="text"
                    value={newClientData.dic}
                    onChange={(e) => setNewClientData({ ...newClientData, dic: e.target.value })}
                    placeholder="DIČ"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Adresa</label>
                  <input
                    type="text"
                    value={newClientData.address}
                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                    placeholder="Ulice a číslo"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Město</label>
                  <input
                    type="text"
                    value={newClientData.city}
                    onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                    placeholder="Město"
                  />
                </div>
                <div className="form-group" style={{ flex: '0 0 100px' }}>
                  <label>PSČ</label>
                  <input
                    type="text"
                    value={newClientData.zip}
                    onChange={(e) => setNewClientData({ ...newClientData, zip: e.target.value })}
                    placeholder="PSČ"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateClient}
                style={{ width: '100%' }}
              >
                Vytvořit klienta
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Datum vystavení *</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Datum splatnosti *</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Datum zdanění</label>
              <input
                type="date"
                name="tax_date"
                value={formData.tax_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Položky faktury *</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                background: '#f9f9f9',
                padding: '8px 15px',
                borderRadius: '5px',
                border: '1px solid #e0e0e0'
              }}>
                <label style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    checked={!pricesIncludeVat}
                    onChange={() => setPricesIncludeVat(false)}
                    style={{ marginRight: '7px', cursor: 'pointer' }}
                  />
                  Ceny bez DPH
                </label>
                <label style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    checked={pricesIncludeVat}
                    onChange={() => setPricesIncludeVat(true)}
                    style={{ marginRight: '7px', cursor: 'pointer' }}
                  />
                  Ceny s DPH
                </label>
              </div>
            </div>
            {items.map((item: any, index: number) => (
              <div key={index} className="invoice-item" style={{ marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '5px', border: '1px solid #e0e0e0' }}>
                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group flex-2" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', color: '#666', fontWeight: '500' }}>Název položky</label>
                    <input
                      type="text"
                      placeholder="Popis položky"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 80px', marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', color: '#666', fontWeight: '500' }}>Množství</label>
                    <input
                      type="number"
                      placeholder="Ks"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', color: '#666', fontWeight: '500' }}>
                      Cena/ks {pricesIncludeVat ? '(s DPH)' : '(bez DPH)'}
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      style={{ height: '42px' }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 90px', marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block', color: '#666', fontWeight: '500' }}>DPH %</label>
                    <select
                      value={item.vat_rate}
                      onChange={(e) => handleItemChange(index, 'vat_rate', e.target.value)}
                      required
                      style={{ padding: '10px', height: '42px' }}
                    >
                      <option value="21">21%</option>
                      <option value="12">12%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                  <div style={{ flex: '0 0 auto', marginBottom: 0 }}>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      style={{ 
                        padding: '0',
                        width: '42px',
                        height: '42px',
                        background: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.3s'
                      }}
                      disabled={items.length === 1}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                      onMouseLeave={(e) => e.currentTarget.style.background = items.length === 1 ? '#ccc' : '#dc3545'}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: '10px' }}>
              + Přidat položku
            </button>
          </div>

          <div className="form-group">
            <label>Poznámka</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Interní poznámka..."
              rows={2}
            />
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Základ:</span>
              <strong>{totals.subtotal.toFixed(2)} Kč</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>DPH:</span>
              <strong>{totals.vat.toFixed(2)} Kč</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', borderTop: '2px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
              <span><strong>Celkem:</strong></span>
              <strong>{totals.total.toFixed(2)} Kč</strong>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (invoice ? 'Ukládám...' : 'Vytvářím...') : (invoice ? 'Uložit změny' : 'Vytvořit fakturu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
