import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — Layout wrapper for public auth pages (Login, Register).
 *
 * Provides a centered, minimal layout suitable for auth forms.
 */
function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
