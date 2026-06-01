import api from './api';

const customerService = {
  getAll: (params = {}) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export default customerService;
