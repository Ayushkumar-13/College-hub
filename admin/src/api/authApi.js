import axiosInstance from './axios';

export const authApi = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
      email: String(email).trim().toLowerCase(),
      password: String(password),
    });
    if (response.data.token) localStorage.setItem('token', response.data.token);
    return response.data;
  },
};
