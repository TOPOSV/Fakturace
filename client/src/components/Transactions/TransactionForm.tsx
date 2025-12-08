import React, { useState } from 'react';
import { transactionService } from '../../services';
import '../Clients/ClientForm.css';

interface TransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  transaction?: any;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSuccess, transaction }) => {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'income',
    category: transaction?.category || '',
    amount: transaction?.amount || '',
    vat_amount: transaction?.vat_amount || '',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-calculate VAT if amount changes
    if (name === 'amount' && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        const vat = (amount * 0.21).toFixed(2);
        setFormData(prev => ({ ...prev, amount: value, vat_amount: vat }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        vat_amount: parseFloat(formData.vat_amount) || 0,
      };

      if (transaction) {
        await transactionService.update(transaction.id, data);
      } else {
        await transactionService.create(data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nepodařilo se uložit transakci');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{transaction ? 'Upravit transakci' : 'Nová transakce'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Typ *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="income">Příjem</option>
                <option value="expense">Výdaj</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Datum *</label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Služby, materiál, mzdy..."
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label>Částka * (Kč)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />
            </div>
            <div className="form-group flex-1">
              <label>DPH (Kč)</label>
              <input
                type="number"
                name="vat_amount"
                value={formData.vat_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Popis</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detaily transakce..."
              rows={3}
            />
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

export default TransactionForm;
