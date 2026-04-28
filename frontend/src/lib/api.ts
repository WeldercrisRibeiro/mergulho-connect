import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_URL || '';

if (!apiBaseUrl) {
  apiBaseUrl = '/api';
} else if (apiBaseUrl.startsWith('http') && !apiBaseUrl.endsWith('/api')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mergulho_auth_token');
    // Não envia o token fake de emergência para o backend
    if (token && token !== 'FAKE_EMERGENCY_TOKEN' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove Content-Type se for FormData para o browser setar o boundary correto
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
    // Extrai a mensagem de erro do corpo da resposta do backend (NestJS)
    // e substitui error.message para que getErrorMessage() funcione corretamente
    if (error.response?.data?.message) {
      const msg = Array.isArray(error.response.data.message)
        ? error.response.data.message.join('; ')
        : error.response.data.message;
      error.message = msg;
    }
    return Promise.reject(error);
  }
);

export default api;
