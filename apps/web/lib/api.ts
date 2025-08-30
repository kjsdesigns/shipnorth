import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8850';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Cache busting for development
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  },
  // Add cache busting parameter to all requests in development
  params: process.env.NODE_ENV === 'development' ? { _cb: Date.now() } : {},
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
  
  registerEnhanced: async (data: any) => {
    const response = await api.post('/registration/register-enhanced', data);
    return response.data;
  },
  
  lookupPostalCode: async (postalCode: string) => {
    const response = await api.get(`/registration/postal-lookup/${postalCode}`);
    return response.data;
  },
  
  validateAddress: async (addressData: any) => {
    const response = await api.post('/registration/validate-address', addressData);
    return response.data;
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

  switchPortal: async (portal: 'staff' | 'driver' | 'customer') => {
    const response = await api.post('/auth/switch-portal', { portal });

    // Update user data in cookies with new portal info
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        lastUsedPortal: portal,
        availablePortals: response.data.availablePortals,
        hasAdminAccess: response.data.hasAdminAccess,
      };
      Cookies.set('user', JSON.stringify(updatedUser));
    }

    return response.data;
  },

  // Driver-specific APIs
  gps: {
    updateLocation: (locationData: {
      lat: number;
      lng: number;
      accuracy?: number;
      isManual?: boolean;
      address?: string;
    }) => api.post('/gps/location', locationData),
    getCurrentLocation: () => api.get('/gps/current'),
    getHistory: (date?: string, limit?: number) =>
      api.get('/gps/history', { params: { date, limit } }),
  },

  scanning: {
    scanPackage: (scanData: {
      scannedValue: string;
      scanType?: string;
      lat?: number;
      lng?: number;
      notes?: string;
      loadId?: string;
    }) => api.post('/scanning/scan', scanData),
    getHistory: (date?: string, limit?: number) =>
      api.get('/scanning/history', { params: { date, limit } }),
    lookupPackage: (query: string, loadId?: string) =>
      api.get(`/scanning/lookup/${encodeURIComponent(query)}`, { params: { loadId } }),
    validateDelivery: (packageId: string) => api.post(`/scanning/validate-delivery/${packageId}`),
  },

  media: {
    uploadPhoto: (photoData: { packageId: string; photoData: string; metadata?: any }) =>
      api.post('/media/photo/upload', photoData),
    uploadSignature: (signatureData: {
      packageId: string;
      signatureData: string;
      recipientName?: string;
      metadata?: any;
    }) => api.post('/media/signature/upload', signatureData),
    getPackageMedia: (packageId: string) => api.get(`/media/package/${packageId}`),
  },

  sync: {
    addToQueue: (syncData: { action: string; data: any; priority?: string }) =>
      api.post('/sync/queue/add', syncData),
    processQueue: (date?: string) => api.post('/sync/queue/process', { date }),
    getQueueStatus: (hours?: number) => api.get('/sync/queue/status', { params: { hours } }),
  },

  routes: {
    generateAI: (loadId: string, options?: any) =>
      api.post(`/ai-routes/loads/${loadId}/generate-route`, { options, saveAsActive: false }),
    getRouteVersions: (loadId: string, includeData?: boolean) =>
      api.get(`/ai-routes/loads/${loadId}/routes`, { params: { includeData } }),
    getActiveRoute: (loadId: string, includeFullData?: boolean) =>
      api.get(`/ai-routes/loads/${loadId}/active-route`, { params: { includeFullData } }),
    modifyRoute: (routeId: string, modifications: any, reason?: string) =>
      api.post(`/ai-routes/routes/${routeId}/modify`, { modifications, reason }),
    activateRoute: (routeId: string) => api.post(`/ai-routes/routes/${routeId}/activate`),
    compareRoutes: (routeId: string, compareWithId: string) =>
      api.get(`/ai-routes/routes/${routeId}/compare/${compareWithId}`),
  },
};

// Customer API
export const customerAPI = {
  list: () => api.get('/customers'),
  search: (query: string) => api.get('/customers/search', { params: { q: query } }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getPackages: (id: string) => api.get(`/customers/${id}/packages`),
  getInvoices: (id: string) => api.get(`/customers/${id}/invoices`),
  setupPayment: (id: string) => api.post(`/customers/${id}/setup-payment`),
  register: (data: any) => api.post('/customers/register', data),
  completeRegistration: (customerId: string, setupTokenId: string) =>
    api.post('/customers/complete-registration', { customerId, setupTokenId }),
  createVaultOrder: (customerId: string) =>
    api.post('/customers/create-vault-order', { customerId }),
  completePaymentMethod: (customerId: string, orderId: string) =>
    api.post('/customers/complete-payment-method', { customerId, orderId }),
  processPayment: (customerId: string, amount: number, description: string, referenceId: string) =>
    api.post('/customers/process-payment', { customerId, amount, description, referenceId }),
  import: (customers: any[]) => api.post('/customers/import', { customers }),
  // Payment method management
  getPaymentMethods: (id: string) => api.get(`/customers/${id}/payment-methods`),
  replacePaymentMethod: (id: string) => api.post(`/customers/${id}/payment-methods/replace`),
  completePaymentReplacement: (id: string, setupTokenId: string) =>
    api.post(`/customers/${id}/payment-methods/complete-replacement`, { setupTokenId }),
  // Customer self-service payment methods
  getMyPaymentMethods: () => api.get('/customers/me/payment-methods'),
  replaceMyPaymentMethod: () => api.post('/customers/me/payment-methods/replace'),
  completeMyPaymentReplacement: (setupTokenId: string) =>
    api.post('/customers/me/payment-methods/complete-replacement', { setupTokenId }),
};

// Package API
export const packageAPI = {
  list: (params?: { limit?: number; status?: string; page?: number }) =>
    api.get('/packages', { params }),
  get: (id: string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
  getQuote: (id: string) => api.post(`/packages/${id}/quote`),
  purchaseLabel: (id: string) => api.post(`/packages/${id}/purchase-label`),
  charge: (id: string) => api.post(`/packages/${id}/charge`),
  getTracking: (id: string) => api.get(`/packages/${id}/tracking`),
  getStats: () => api.get('/packages/stats/overview'),
  getByLoad: (loadId: string) => api.get(`/packages/by-load/${loadId}`),
  bulkAssign: (packageIds: string[], loadId: string) =>
    api.post('/packages/bulk-assign', { packageIds, loadId }),
  markDelivered: (id: string, deliveryData: any) =>
    api.post(`/packages/${id}/mark-delivered`, deliveryData),
  // Package consolidation
  consolidate: (childId: string, parentId: string) =>
    api.post(`/packages/${childId}/consolidate/${parentId}`),
  removeFromConsolidation: (childId: string) => api.delete(`/packages/${childId}/consolidate`),
  getWithRelationships: (id: string) => api.get(`/packages/${id}/relationships`),
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
  updateGPS: (id: string, lat: number, lng: number) => api.post(`/loads/${id}/gps`, { lat, lng }),
  updateDeliveryCities: (id: string, cities: any[]) =>
    api.put(`/loads/${id}/delivery-cities`, { cities }),
  addLocation: (id: string, lat: number, lng: number, isManual: boolean, address?: string) =>
    api.post(`/loads/${id}/location`, { lat, lng, isManual, address }),
  getLocations: (id: string) => api.get(`/loads/${id}/locations`),
};

// Invoice API
export const invoiceAPI = {
  list: () => api.get('/invoices'),
  get: (id: string) => api.get(`/invoices/${id}`),
  retryPayment: (id: string) => api.post(`/invoices/${id}/retry-payment`),
  refund: (id: string) => api.post(`/invoices/${id}/refund`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (settings: any) => api.put('/settings', settings),
  getOriginAddress: () => api.get('/settings/origin-address'),
  updateOriginAddress: (address: any) => api.put('/settings/origin-address', address),
};

// Admin User Management API
export const adminUserAPI = {
  list: (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/users', { params }),
  get: (id: string) => api.get(`/admin/users/${id}`),
  create: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'staff' | 'admin' | 'driver';
    phone?: string;
  }) => api.post('/admin/users', userData),
  update: (id: string, updates: any) => api.put(`/admin/users/${id}`, updates),
  updateStatus: (id: string, status: 'active' | 'inactive') =>
    api.patch(`/admin/users/${id}/status`, { status }),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
  bulkUpdate: (userIds: string[], updates: any) =>
    api.post('/admin/users/bulk-update', { userIds, updates }),
  getActivity: (id: string) => api.get(`/admin/users/${id}/activity`),
  export: () => api.get('/admin/users/export'),
};

// Admin Cities Management API
export const adminCityAPI = {
  list: () => api.get('/admin/cities'),
  get: (id: string) => api.get(`/admin/cities/${id}`),
  create: (cityData: { name: string; province: string; alternativeNames?: string[] }) =>
    api.post('/admin/cities', cityData),
  update: (id: string, updates: any) => api.put(`/admin/cities/${id}`, updates),
  delete: (id: string) => api.delete(`/admin/cities/${id}`),
  addAlternativeName: (id: string, name: string) =>
    api.post(`/admin/cities/${id}/alternative-names`, { name }),
  removeAlternativeName: (id: string, name: string) =>
    api.delete(`/admin/cities/${id}/alternative-names`, { data: { name } }),
};

// Route Optimization API
export const routeAPI = {
  optimizeRoute: (
    loadId: string,
    options?: {
      maxDailyDrivingHours?: number;
      averageSpeedKmh?: number;
      deliveryTimeMinutes?: number;
      includeReturnTrip?: boolean;
      prioritizeFuelEfficiency?: boolean;
      checkTrafficConditions?: boolean;
      avoidSevereWeather?: boolean;
    }
  ) => api.post(`/routes/loads/${loadId}/optimize-route`, options),

  analyzeRoute: (loadId: string) => api.get(`/routes/loads/${loadId}/route-analysis`),

  getRoutePreview: (loadId: string) => api.get(`/routes/loads/${loadId}/route-preview`),

  getRoutingReadiness: () => api.get('/routes/routing-readiness'),

  getSavedRoutes: (loadId: string) => api.get(`/routes/loads/${loadId}/saved-routes`),

  applyRoute: (routeId: string) => api.post(`/routes/routes/${routeId}/apply`),

  getRouteHistory: (loadId: string) => api.get(`/routes/loads/${loadId}/route-history`),

  addRouteFeedback: (
    routeId: string,
    feedback: {
      rating: number;
      comments: string;
      actualDuration?: number;
      actualDistance?: number;
      issues: string[];
    }
  ) => api.post(`/routes/routes/${routeId}/feedback`, feedback),

  getRoute: (routeId: string) => api.get(`/routes/routes/${routeId}`),

  getTrafficConditions: (loadId: string) => api.get(`/routes/loads/${loadId}/traffic-conditions`),

  getWeather: (lat: number, lng: number) => api.get(`/routes/weather/${lat}/${lng}`),
};
