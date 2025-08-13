import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          Cookies.set('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    Cookies.set('accessToken', accessToken);
    Cookies.set('refreshToken', refreshToken);
    Cookies.set('user', JSON.stringify(user));
    
    return { user };
  },
  
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;
    
    Cookies.set('accessToken', accessToken);
    Cookies.set('refreshToken', refreshToken);
    Cookies.set('user', JSON.stringify(user));
    
    return { user };
  },
  
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    window.location.href = '/';
  },
  
  getCurrentUser: () => {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Customer API
export const customerAPI = {
  list: () => api.get('/customers'),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getPackages: (id: string) => api.get(`/customers/${id}/packages`),
  getInvoices: (id: string) => api.get(`/customers/${id}/invoices`),
  setupPayment: (id: string) => api.post(`/customers/${id}/setup-payment`),
};

// Package API
export const packageAPI = {
  list: () => api.get('/packages'),
  get: (id: string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
  getQuote: (id: string) => api.post(`/packages/${id}/quote`),
  purchaseLabel: (id: string) => api.post(`/packages/${id}/purchase-label`),
  charge: (id: string) => api.post(`/packages/${id}/charge`),
  getTracking: (id: string) => api.get(`/packages/${id}/tracking`),
};

// Load API
export const loadAPI = {
  list: () => api.get('/loads'),
  get: (id: string) => api.get(`/loads/${id}`),
  create: (data: any) => api.post('/loads', data),
  update: (id: string, data: any) => api.put(`/loads/${id}`, data),
  delete: (id: string) => api.delete(`/loads/${id}`),
  assignPackages: (id: string, packageIds: string[]) => 
    api.put(`/loads/${id}/assign-packages`, { packageIds }),
  getManifest: (id: string) => api.get(`/loads/${id}/manifest`),
  updateGPS: (id: string, lat: number, lng: number) => 
    api.post(`/loads/${id}/gps`, { lat, lng }),
};

// Invoice API
export const invoiceAPI = {
  list: () => api.get('/invoices'),
  get: (id: string) => api.get(`/invoices/${id}`),
  retryPayment: (id: string) => api.post(`/invoices/${id}/retry-payment`),
  refund: (id: string) => api.post(`/invoices/${id}/refund`),
};