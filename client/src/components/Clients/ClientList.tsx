import React, { useEffect, useState } from 'react';
import { clientService } from '../../services';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Klienti</h1>
        <button className="btn-primary">+ Nový klient</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Název firmy</th>
            <th>IČO</th>
            <th>DIČ</th>
            <th>Město</th>
            <th>Email</th>
            <th>Telefon</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.company_name}</td>
              <td>{client.ico}</td>
              <td>{client.dic}</td>
              <td>{client.city}</td>
              <td>{client.email}</td>
              <td>{client.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientList;
