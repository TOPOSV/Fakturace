import React, { useState } from 'react';
import { clientService } from '../../services';
import './ClientForm.css';

interface ClientFormProps {
  onClose: () => void;
  onSuccess: () => void;
  client?: any;
}

const ClientForm: React.FC<ClientFormProps> = ({ onClose, onSuccess, client }) => {
  const [formData, setFormData] = useState({
    company_name: client?.company_name || '',
    ico: client?.ico || '',
    dic: client?.dic || '',
    address: client?.address || '',
    city: client?.city || '',
    zip: client?.zip || '',
    country: client?.country || 'Česká republika',
    email: client?.email || '',
    phone: client?.phone || '',
    is_vat_payer: client?.is_vat_payer !== undefined ? Boolean(client.is_vat_payer) : true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleICOLookup = async () => {
    if (!formData.ico) return;
    
    setLookingUp(true);
    setError('');
    try {
      const data = await clientService.lookupByICO(formData.ico);
      setFormData({
        ...formData,
        company_name: data.company_name || formData.company_name,
        dic: data.dic || formData.dic,
        address: data.address || formData.address,
        city: data.city || formData.city,
        zip: data.zip || formData.zip,
      });
    } catch (err: any) {
      setError('Nepodařilo se najít firmu podle IČO');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (client) {
        await clientService.update(client.id, formData);
      } else {
        await clientService.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se uložit klienta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{client ? 'Upravit klienta' : 'Nový klient'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>IČO</label>
              <div className="ico-lookup">
                <input
                  type="text"
                  name="ico"
                  value={formData.ico}
                  onChange={handleChange}
                  placeholder="12345678"
                />
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleICOLookup}
                  disabled={lookingUp || !formData.ico}
                >
                  {lookingUp ? 'Hledám...' : 'Vyhledat'}
                </button>
              </div>
            </div>
            <div className="form-group flex-2">
              <label>DIČ</label>
              <input
                type="text"
                name="dic"
                value={formData.dic}
                onChange={handleChange}
                placeholder="CZ12345678"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Název firmy *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Adresa</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ulice 123"
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label>Město</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Praha"
              />
            </div>
            <div className="form-group flex-1">
              <label>PSČ</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                placeholder="120 00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="firma@example.com"
              />
            </div>
            <div className="form-group flex-1">
              <label>Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+420 123 456 789"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_vat_payer"
                checked={formData.is_vat_payer}
                onChange={handleChange}
              />
              <span>Plátce DPH</span>
            </label>
            <div className="help-text">
              Pokud je klient plátcem DPH, bude DPH zobrazeno na faktuře. V opačném případě bude faktura bez DPH.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
