import axios from 'axios';

/**
 * Axios instance — Fileex API client.
 *
 * Design decisions:
 *
 * 1. ACCESS TOKEN IN MEMORY (not localStorage)
 *    Storing the JWT in localStorage exposes it to XSS attacks.
 *    We store it in a module-scoped variable — invisible to browser extensions
 *    and injected scripts. It is lost on page refresh (intentional — the
 *    refresh token in the HTTP-only cookie silently issues a new one).
 *
 * 2. REFRESH TOKEN IN HTTP-ONLY COOKIE
 *    `withCredentials: true` ensures the browser sends the cookie on every
 *    request to the same origin, including the /auth/refresh call.
 *
 * 3. SILENT REFRESH ON 401
 *    The response interceptor catches 401, calls /auth/refresh once, updates
 *    the in-memory token, and retries the original request transparently.
 *    The `_retry` flag prevents infinite retry loops.
 *
 * See: docs/ARCHITECTURE.md §7
 */

// Module-scoped access token — intentionally not exported.
// Use setAccessToken() and clearAccessToken() to manage it.
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };

// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,           // send HTTP-only refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach access token to every request
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    // Only attempt refresh once per request to avoid infinite loops.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);                // retry original request
      } catch (_refreshError) {
        // Refresh token is also expired — force logout.
        clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(_refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
