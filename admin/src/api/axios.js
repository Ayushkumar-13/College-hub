import axios from 'axios';
import { API_URL, BACKEND_URL } from '@/config';

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
    return Promise.reject({
      error: `Cannot reach API at ${API_URL}. Check ${BACKEND_URL} is running.`,
    });
  }
);

export default axiosInstance;
