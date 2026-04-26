import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');
const resolvedBaseUrl = configuredBaseUrl || (isLocalHost ? 'http://localhost:3001/api' : '/api');
const apiBaseUrl = normalizeBaseUrl(resolvedBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('maintenance_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if ((status === 401 || status === 403) && localStorage.getItem('maintenance_auth_token')) {
      localStorage.removeItem('maintenance_auth_token');
      localStorage.removeItem('maintenance_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
    if (normalizedMessage && typeof normalizedMessage === 'string') {
      error.message = normalizedMessage;
    }

    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => apiBaseUrl;

export default api;
