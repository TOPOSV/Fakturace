import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import './Settings.css';

interface SettingsFormData {
  company_name: string;
  ico: string;
  dic: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  bank_account: string;
  iban: string;
  logo: string | null;
  stamp: string | null;
  invoice_numbering_format: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState<SettingsFormData>({
    company_name: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    bank_account: '',
    iban: '',
    logo: null,
    stamp: null,
    invoice_numbering_format: 'year_4',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setFormData({
        company_name: response.data.company_name || '',
        ico: response.data.ico || '',
        dic: response.data.dic || '',
        address: response.data.address || '',
        city: response.data.city || '',
        zip: response.data.zip || '',
        phone: response.data.phone || '',
        bank_account: response.data.bank_account || '',
        iban: response.data.iban || '',
        logo: response.data.logo || null,
        stamp: response.data.stamp || null,
        invoice_numbering_format: response.data.invoice_numbering_format || 'year_4',
      });
      if (response.data.logo) {
        setLogoPreview(response.data.logo);
      }
      if (response.data.stamp) {
        setStampPreview(response.data.stamp);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Nepodařilo se načíst profil' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Soubor je příliš velký. Maximální velikost je 2 MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, logo: base64 });
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Soubor je příliš velký. Maximální velikost je 2 MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, stamp: base64 });
        setStampPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.put('/auth/profile', formData);
      setMessage({ type: 'success', text: 'Profil byl úspěšně aktualizován' });
      
      // Reload to update header
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Nepodařilo se aktualizovat profil' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Nastavení profilu</h1>
        <p>Upravte údaje o vaší firmě a nahrajte logo a razítko</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h2>Základní údaje</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="company_name">Název společnosti *</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ico">IČO</label>
              <input
                type="text"
                id="ico"
                name="ico"
                value={formData.ico}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dic">DIČ</label>
              <input
                type="text"
                id="dic"
                name="dic"
                value={formData.dic}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefon</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Adresa</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="address">Ulice a číslo popisné</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">Město</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip">PSČ</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>📋 Číslování faktur</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="invoice_numbering_format">Formát číslování</label>
              <select
                id="invoice_numbering_format"
                name="invoice_numbering_format"
                value={formData.invoice_numbering_format}
                onChange={handleChange}
                className="form-select"
              >
                <option value="year_3">Rok + 3 čísla (např. 2025001)</option>
                <option value="year_4">Rok + 4 čísla (např. 20250001)</option>
                <option value="year_5">Rok + 5 čísel (např. 202500001)</option>
              </select>
              <small>Čísla faktur budou použita jako variabilní symbol (bez písmen VF/PF)</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>🌓 Vzhled aplikace</h2>
          <div className="theme-toggle-section">
            <div className="theme-toggle-info">
              <label>Barevný režim</label>
              <p>Přepínejte mezi světlým a tmavým režimem</p>
            </div>
            <div className="theme-toggle-control">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Přepnout režim"
              >
                {theme === 'light' ? (
                  <>
                    <span className="theme-icon">🌙</span>
                    <span>Tmavý režim</span>
                  </>
                ) : (
                  <>
                    <span className="theme-icon">☀️</span>
                    <span>Světlý režim</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Bankovní údaje</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="bank_account">Číslo účtu</label>
              <input
                type="text"
                id="bank_account"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                placeholder="123456789/0100"
              />
              <small>Číslo účtu bude zobrazeno na fakturách</small>
            </div>
            <div className="form-group full-width">
              <label htmlFor="iban">IBAN</label>
              <input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                placeholder="CZ65 0800 0000 1920 0014 5399"
              />
              <small>IBAN pro QR kódy plateb na fakturách (mezery budou automaticky odstraněny)</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Logo společnosti</h2>
          <div className="upload-section">
            <div className="upload-info">
              <p>Logo se zobrazí v hlavičce aplikace a na fakturách nad dodavatelem</p>
              <small>Doporučený formát: PNG s průhledným pozadím, maximální velikost 2 MB</small>
            </div>
            <div className="upload-container">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="file-input"
              />
              <label htmlFor="logo" className="file-label">
                📤 Nahrát logo
              </label>
              {logoPreview && (
                <div className="image-preview">
                  <img src={logoPreview} alt="Logo náhled" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      setFormData({ ...formData, logo: null });
                      setLogoPreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Razítko</h2>
          <div className="upload-section">
            <div className="upload-info">
              <p>Razítko se zobrazí na fakturách v poli pro razítko a podpis</p>
              <small>Doporučený formát: PNG s průhledným pozadím, maximální velikost 2 MB</small>
            </div>
            <div className="upload-container">
              <input
                type="file"
                id="stamp"
                accept="image/*"
                onChange={handleStampUpload}
                className="file-input"
              />
              <label htmlFor="stamp" className="file-label">
                📤 Nahrát razítko
              </label>
              {stampPreview && (
                <div className="image-preview">
                  <img src={stampPreview} alt="Razítko náhled" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      setFormData({ ...formData, stamp: null });
                      setStampPreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ukládání...' : '💾 Uložit změny'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
