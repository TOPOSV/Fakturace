import React, { useState, useEffect } from 'react';
import { invoiceService, clientService } from '../../services';
import '../Clients/ClientForm.css';

interface InvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  invoice?: any;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onSuccess, invoice }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: invoice?.client_id?.toString() || '',
    type: invoice?.type || 'invoice',
    issue_date: invoice?.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_date: invoice?.tax_date ? new Date(invoice.tax_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    currency: invoice?.currency || 'CZK',
    notes: invoice?.notes || '',
  });
  const [items, setItems] = useState(
    invoice?.items || [{ description: '', quantity: 1, unit_price: 0, vat_rate: 21 }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
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
    setItems([...items, { description: '', quantity: 1, unit_price: 0, vat_rate: 21 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_item: any, i: number) => i !== index));
    }
  };

  const calculateTotal = () => {
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.quantity * item.unit_price;
    });
    const vat = subtotal * 0.21;
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

    if (items.some((item: any) => !item.description || item.unit_price <= 0)) {
      setError('Vyplňte všechny položky faktury');
      setLoading(false);
      return;
    }

    try {
      const data = {
        ...formData,
        client_id: parseInt(formData.client_id),
        items: items,
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>{invoice ? 'Upravit fakturu' : 'Nová faktura'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Klient *</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
              >
                <option value="">Vyberte klienta</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name} {client.ico && `(IČO: ${client.ico})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Typ *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="invoice">Faktura</option>
                <option value="proforma">Záloha</option>
                <option value="quote">Nabídka</option>
              </select>
            </div>
          </div>

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
            <label>Položky faktury *</label>
            {items.map((item: any, index: number) => (
              <div key={index} className="invoice-item" style={{ marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '5px' }}>
                <div className="form-row">
                  <div className="form-group flex-2">
                    <input
                      type="text"
                      placeholder="Popis položky"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 80px' }}>
                    <input
                      type="number"
                      placeholder="Ks"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <input
                      type="number"
                      placeholder="Cena/ks"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{ padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
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
              <span>DPH 21%:</span>
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
