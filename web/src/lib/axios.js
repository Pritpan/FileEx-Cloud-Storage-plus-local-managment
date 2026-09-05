import axios from 'axios';

let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };

// ---------------------------------------------------------------------------
// Resolve the API base URL.
//
// Security model:
//  - In Electron: the URL is injected by the Main Process at runtime via
//    the secure contextBridge (app:get-config). It is NEVER baked into the
//    renderer bundle. The renderer has no access to process.env.
//  - On web: falls back to the Vite-compiled VITE_API_URL or /api/v1.
//
// api is created first with the web fallback, then immediately patched when
// the Electron config promise resolves. Any requests fired in the interim
// use the fallback — this is correct and safe for the web path. In Electron,
// the config resolves in the same microtask queue before real user
// navigation fires API calls.
// ---------------------------------------------------------------------------
const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.getConfig;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In Electron: patch baseURL from Main Process config at runtime.
// IPC channel name is hidden in preload.js — renderer only calls getConfig().
if (isElectron) {
  window.electronAPI.getConfig()
    .then(({ apiUrl }) => { if (apiUrl) api.defaults.baseURL = apiUrl; })
    .catch(() => { /* keep the fallback URL silently */ });
}

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
    return Promise.reject(error);
  },
);

export default api;
