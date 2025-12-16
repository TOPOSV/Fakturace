import React, { useEffect, useState } from 'react';
import { clientService } from '../../services';
import ClientForm from './ClientForm';
import './ClientList.css';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        client.company_name?.toLowerCase().includes(query) ||
        client.ico?.toLowerCase().includes(query) ||
        client.dic?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.city?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
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

  const handleEdit = (client: any, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client: any, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const confirmed = await showConfirmDialog(`Opravdu chcete smazat klienta "${client.company_name}"?`);
    if (!confirmed) return;
    
    try {
      await clientService.delete(client.id);
      loadClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Nepodařilo se smazat klienta');
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
      
      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Vyhledat klienta (název, IČO, DIČ, email, telefon, město)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px',
            fontSize: '15px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
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
            <th style={{ width: '120px', textAlign: 'center' }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <tr key={client.id}>
              <td>{client.company_name}</td>
              <td>{client.ico}</td>
              <td>{client.dic}</td>
              <td>{client.city}</td>
              <td>{client.email}</td>
              <td>{client.phone}</td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={(e) => handleEdit(client, e)}
                    className="action-btn edit-btn"
                    title="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDelete(client, e)}
                    className="action-btn delete-btn"
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
      
      {filteredClients.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          {searchQuery ? 'Žádní klienti nenalezeni' : 'Zatím nemáte žádné klienty'}
        </div>
      )}

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
