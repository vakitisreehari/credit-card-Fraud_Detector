import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000
});

// Inject JWT token into requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 Unauthorized / Token Expiration
API.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }
  return Promise.reject(error);
});

// Auth endpoints
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const getMe = () => API.get('/auth/me');
export const updateUserProfile = (profileData) => API.put('/auth/profile', profileData);
export const googleAuth = (credential) => API.post('/auth/google', { credential });

// Transactions
export const processTransaction = (payload) => API.post('/transactions/process', payload);
export const getTransactions = (params) => API.get('/transactions', { params });
export const getTransactionById = (id) => API.get(`/transactions/${id}`);
export const updateTransactionStatus = (id, status) => API.put(`/transactions/${id}/status`, { status });
export const verifyTransactionOTP = (id, otp) => API.post(`/transactions/${id}/verify-otp`, { otp });

// Analytics
export const getDashboardAnalytics = () => API.get('/analytics/dashboard');

// Rules
export const getRules = () => API.get('/rules');
export const updateRule = (id, updateData) => API.put(`/rules/${id}`, updateData);
export const createRule = (ruleData) => API.post('/rules', ruleData);

export default API;
