import axios from 'axios';
const api = axios.create({ baseURL: '/api', timeout: 30000 });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ghmc_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('ghmc_token');
    localStorage.removeItem('ghmc_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});
export const authAPI = {
  login: d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  toggleDuty: () => api.patch('/auth/duty'),
  updateLocation: (lat, lng) => api.patch('/auth/location', { lat, lng }),
  forgotPassword: email => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};
export const complaintsAPI = {
  getAll: p => api.get('/complaints', { params: p }),
  getOne: id => api.get(`/complaints/${id}`),
  create: fd => api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, d) => api.patch(`/complaints/${id}/status`, d),
  assign: (id, tid) => api.patch(`/complaints/${id}/assign`, { technicianId: tid }),
  delete: id => api.delete(`/complaints/${id}`),
};
export const emergencyAPI = {
  raise: d => api.post('/emergency', d),
  getAll: () => api.get('/emergency'),
  respond: (id, action) => api.patch(`/emergency/${id}/respond`, { action }),
};
export const usersAPI = {
  getAll: p => api.get('/users', { params: p }),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateCredentials: (id, data) => api.patch(`/users/${id}/credentials`, data),
  updateMyCredentials: data => api.patch('/users/me/credentials', data),
};
export const jobsAPI = {
  apply: d => api.post('/jobs', d),
  getAll: () => api.get('/jobs'),
  review: (id, action) => api.patch(`/jobs/${id}/review`, { action }),
};
export const supportAPI = {
  create: d => api.post('/support', d),
  getAll: () => api.get('/support'),
  reply: (id, text) => api.post(`/support/${id}/reply`, { text }),
};
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
};
export const analyticsAPI = { get: () => api.get('/analytics') };
export const getUploadUrl = f => `/uploads/${f}`;
export default api;
