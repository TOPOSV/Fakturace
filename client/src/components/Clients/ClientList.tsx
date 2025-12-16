import React, { useEffect, useState } from 'react';
import { clientService } from '../../services';
import ClientForm from './ClientForm';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

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

  const handleEdit = (client: any, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm(`Opravdu chcete smazat klienta "${client.company_name}"?`)) {
      try {
        await clientService.delete(client.id);
        loadClients();
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('Nepodařilo se smazat klienta');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleSuccess = () => {
    loadClients();
  };

  if (loading) return <div>Načítání...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Klienti</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nový klient</button>
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
            <th style={{ width: '100px', textAlign: 'center' }}>Akce</th>
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
              <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => handleEdit(client, e)}
                    style={{
                      padding: '5px 10px',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDelete(client, e)}
                    style={{
                      padding: '5px 10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Smazat"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <ClientForm
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
          client={editingClient}
        />
      )}
    </div>
  );
};

export default ClientList;
