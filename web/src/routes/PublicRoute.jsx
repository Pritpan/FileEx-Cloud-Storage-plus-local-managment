import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * PublicRoute — Guards routes that should be inaccessible when authenticated.
 */
function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing  = useAuthStore((s) => s.isInitializing);

  // Wait for session check before deciding
  if (isInitializing) return null;

  return isAuthenticated ? <Navigate to="/explorer" replace /> : <Outlet />;
}

export default PublicRoute;
