import api from '@/lib/axios';
import { AUTH } from '@/constants/api';

/**
 * auth.service.js
 * Communicates with the backend auth endpoints.
 */

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post(AUTH.LOGIN, credentials);
    return data.data; // { user, accessToken }
  },
  
  register: async (credentials) => {
    const { data } = await api.post(AUTH.REGISTER, credentials);
    return data.data; // { user, accessToken }
  },
  
  logout: async () => {
    const { data } = await api.post(AUTH.LOGOUT);
    return data;
  },
  
  refresh: async () => {
    // The browser automatically sends the HttpOnly refresh token cookie
    const { data } = await api.post(AUTH.REFRESH);
    return data.data; // { user, accessToken }
  }
};
