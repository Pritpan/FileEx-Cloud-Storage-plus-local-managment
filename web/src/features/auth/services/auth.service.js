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
    return data; // { success, message, data: { user } }
  },
  
  logout: async () => {
    const { data } = await api.post(AUTH.LOGOUT);
    return data;
  },
  
  refresh: async () => {
    // The browser automatically sends the HttpOnly refresh token cookie
    const { data } = await api.post(AUTH.REFRESH);
    return data.data; // { user, accessToken }
  },

  verifyEmail: async (token) => {
    const { data } = await api.get(AUTH.VERIFY_EMAIL, { params: { token } });
    return data; // { success, message }
  },

  resendVerification: async (email) => {
    const { data } = await api.post(AUTH.RESEND_VERIFICATION, { email });
    return data; // { success, message }
  },

  deleteAccount: async () => {
    const { data } = await api.delete(AUTH.DELETE_ACCOUNT);
    return data;
  },
};

