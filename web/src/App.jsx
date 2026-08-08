import { useEffect } from 'react';
import AppRouter from '@/routes/AppRouter';
import { useAuthStore, useThemeStore } from '@/store';
import { authService } from '@/features/auth';
import { Toaster } from '@/components/ui/sonner';

/**
 * App — Root component.
 * Handles one-time session restoration and theme initialization on mount.
 */
function App() {
  const { setAuth, clearAuth } = useAuthStore();
  const initTheme = useThemeStore((s) => s.init);

  useEffect(() => {
    // Apply saved theme before first paint to avoid flash
    initTheme();

    const restoreSession = async () => {
      try {
        const data = await authService.refresh();
        setAuth(data.user, data.accessToken);
      } catch (error) {
        // Refresh token is missing, expired, or invalid.
        clearAuth();
      }
    };
    
    restoreSession();
  }, [setAuth, clearAuth, initTheme]);

  return (
    <>
      <AppRouter />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;

