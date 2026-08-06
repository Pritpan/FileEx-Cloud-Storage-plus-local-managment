import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';

/**
 * ProtectedRoute — Guards routes that require authentication.
 */
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing  = useAuthStore((s) => s.isInitializing);

  // Wait for session check before deciding
  if (isInitializing) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
