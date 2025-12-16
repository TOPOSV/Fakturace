import api from './api';

export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  update: async (id: number, clientData: any) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  lookupByICO: async (ico: string) => {
    const response = await api.get(`/clients/lookup/${ico}`);
    return response.data;
  },
};

export const invoiceService = {
  getAll: async (params?: any) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (invoiceData: any) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  update: async (id: number, invoiceData: any) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },
};

export const transactionService = {
  getAll: async (params?: any) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  create: async (transactionData: any) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  update: async (id: number, transactionData: any) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export const statsService = {
  getStatistics: async (params: any) => {
    const response = await api.get('/stats/statistics', { params });
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },
};
