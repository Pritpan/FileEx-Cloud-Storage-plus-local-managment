import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authService } from '../services/auth.service';

/**
 * Hook to handle the logout flow.
 */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if the server call fails
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return logout;
}
