import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.showToast) window.showToast('Session expired. Please log in again.', 'warning');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
    }
    if (error.response) return Promise.reject(error.response.data);
    const base = import.meta.env.VITE_API_URL || '/api';
    const hint = base.startsWith('/')
      ? `Start backend on ${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050'} (cd backend && npm run dev)`
      : `Start backend: cd backend && npm run dev`;
    return Promise.reject({
      error: `Cannot reach API at ${base}. ${hint}`,
    });
  }
);

export default axiosInstance;
