import React, { useEffect, useState } from 'react';
import { transactionService } from '../../services';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Příjmy a Výdaje</h1>
        <button className="btn-primary">+ Nová transakce</button>
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
            <tr key={transaction.id}>
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
    </div>
  );
};

export default TransactionList;
