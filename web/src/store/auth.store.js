import { create } from 'zustand';
import { setAccessToken, clearAccessToken } from '@/lib/axios';

/**
 * auth.store.js
 * Manages authentication state in memory.
 */
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true, // True while App.jsx checks the refresh session on mount

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isInitializing: false });
  },

  clearAuth: () => {
    clearAccessToken();
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },
}));

export default useAuthStore;
