import axios from 'axios';

let envUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').trim().replace(/\/+$/, '');
if (!envUrl.endsWith('/api')) {
  envUrl += '/api';
}
const API_BASE_URL = envUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add Authorization Bearer token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or unauthorized, clean storage if 401 on protected requests
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login attempt failure
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

// Parking slots endpoints
export const slotService = {
  getAll: async () => {
    const res = await api.get('/slots');
    return res.data;
  },
  getAvailable: async (startTime = '', endTime = '') => {
    let url = '/slots/available';
    if (startTime && endTime) {
      url += `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
    }
    const res = await api.get(url);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/slots/${id}`);
    return res.data;
  },
  create: async (slotData) => {
    const res = await api.post('/slots', slotData);
    return res.data;
  },
  update: async (id, slotData) => {
    const res = await api.patch(`/slots/${id}`, slotData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/slots/${id}`);
    return res.data;
  },
  getOccupancy: async () => {
    const res = await api.get('/slots/occupancy');
    return res.data;
  }
};

// Bookings endpoints
export const bookingService = {
  create: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },
  getMy: async () => {
    const res = await api.get('/bookings/my');
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/bookings');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await api.patch(`/bookings/${id}/cancel`);
    return res.data;
  }
};

export default api;
