import { Outlet } from 'react-router-dom';
import { useThemeStore } from '@/store';

/**
 * AuthLayout — Layout wrapper for public auth pages (Login, Register).
 * Shows the Cloud (Sky) background image matching the app theme.
 */
function AuthLayout() {
  const theme = useThemeStore((s) => s.theme);
  const bgSrc = theme === 'dark'
    ? '/backgrounds/cloud-dark.png'
    : '/backgrounds/cloud-light.png';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden theme-cloud">
      {/* Background */}
      <img
        src={bgSrc}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      />
      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
