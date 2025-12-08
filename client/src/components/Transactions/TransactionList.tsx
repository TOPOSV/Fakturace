import React, { useEffect, useState } from 'react';
import { transactionService } from '../../services';
import TransactionForm from './TransactionForm';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleSuccess = () => {
    loadTransactions();
  };

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Příjmy a Výdaje</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nová transakce</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Typ</th>
            <th>Kategorie</th>
            <th>Popis</th>
            <th>Částka</th>
            <th>DPH</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} onClick={() => handleEdit(transaction)} style={{ cursor: 'pointer' }}>
              <td>{new Date(transaction.transaction_date).toLocaleDateString('cs-CZ')}</td>
              <td>{transaction.type === 'income' ? 'Příjem' : 'Výdaj'}</td>
              <td>{transaction.category}</td>
              <td>{transaction.description}</td>
              <td className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                {transaction.type === 'income' ? '+' : '-'}{transaction.amount?.toFixed(2)} Kč
              </td>
              <td>{transaction.vat_amount?.toFixed(2)} Kč</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <TransactionForm
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
          transaction={editingTransaction}
        />
      )}
    </div>
  );
};

export default TransactionList;
