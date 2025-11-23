import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteResume: () => api.delete('/users/resume'),
  getStats: () => api.get('/users/stats'),
};

// Interview API
export const interviewAPI = {
  create: (data) => api.post('/interviews/create', data),
  getAll: (params) => api.get('/interviews/', { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  start: (id) => api.post(`/interviews/${id}/start`),
  respond: (id, data) => api.post(`/interviews/${id}/respond`, data),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  delete: (id) => api.delete(`/interviews/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEvaluation: (id) => api.get(`/analytics/evaluations/${id}`),
  getImprovementTrends: (days) => api.get('/analytics/improvement-trends', { params: { days } }),
  getRecommendations: () => api.get('/analytics/recommendations'),
};

export default api;