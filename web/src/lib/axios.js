import axios from 'axios';

/**
 * Axios instance — Fileex API client.
 */

let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Refresh should initially be handled during application initialization.
    // Interceptor structure is ready for future enhancements (e.g. automatic refresh).
    return Promise.reject(error);
  },
);

export default api;
