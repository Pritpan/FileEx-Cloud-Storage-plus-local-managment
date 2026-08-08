import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useThemeStore
 *
 * Persists the user's theme preference in localStorage under 'fileex-theme'.
 * The applyTheme() function is the single source of truth for toggling the
 * `.dark` class on <html>, so every part of the app reacts instantly.
 */

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark'

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      // Call once on app boot to rehydrate from localStorage
      init: () => {
        applyTheme(get().theme);
      },
    }),
    {
      name: 'fileex-theme', // localStorage key
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // After hydrating from storage, immediately apply the class
        if (state) applyTheme(state.theme);
      },
    }
  )
);

export default useThemeStore;
