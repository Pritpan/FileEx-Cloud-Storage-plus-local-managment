import { useEffect } from 'react';
import AppRouter from '@/routes/AppRouter';
import { useAuthStore } from '@/store';
import { authService } from '@/features/auth';
import { Toaster } from '@/components/ui/sonner';

/**
 * App — Root component.
 * Handles one-time session restoration on mount.
 */
function App() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
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
  }, [setAuth, clearAuth]);

  return (
    <>
      <AppRouter />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
