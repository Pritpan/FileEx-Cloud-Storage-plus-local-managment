import { create } from 'zustand';
import { setAccessToken, clearAccessToken } from '@/lib/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

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
