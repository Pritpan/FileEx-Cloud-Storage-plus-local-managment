import { useEffect } from 'react';
import AppRouter from '@/routes/AppRouter';
import { useAuthStore, useThemeStore } from '@/store';
import { authService } from '@/features/auth';
import { Toaster } from '@/components/ui/sonner';
import { useTransferProgressBridge } from '@/features/upload/hooks/useTransfers';

/**
 * App — Root component.
 * Handles one-time session restoration and theme initialization on mount.
 */
function App() {
  const { setAuth, clearAuth } = useAuthStore();
  const { init: initTheme, setTheme } = useThemeStore();

  // E6: Subscribe to Electron transfer progress events (no-op in browser)
  useTransferProgressBridge();

  useEffect(() => {
    // Check for theme query parameter (e.g. ?theme=dark) from website referral
    const params = new URLSearchParams(window.location.search);
    const queryTheme = params.get('theme');
    if (queryTheme === 'light' || queryTheme === 'dark') {
      setTheme(queryTheme);
    } else {
      // Apply saved theme before first paint to avoid flash
      initTheme();
    }

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
  }, [setAuth, clearAuth, initTheme, setTheme]);

  return (
    <>
      <AppRouter />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;


