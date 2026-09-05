import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import useThemeStore from '@/store/theme.store';

/**
 * DashboardLayout — Layout wrapper for all authenticated pages.
 */

// Maps the current theme + location to the correct background image filename.
const BACKGROUND_MAP = {
  'light-local': './backgrounds/earth-light.png',
  'dark-local':  './backgrounds/earth-dark.png',
  'light-cloud': './backgrounds/cloud-light.png',
  'dark-cloud':  './backgrounds/cloud-dark.png',
};

function DashboardLayout() {
  const location = useLocation();
  const isLocal = location.pathname.startsWith('/local');
  const themeClass = isLocal ? 'theme-local' : 'theme-cloud';

  const theme = useThemeStore((s) => s.theme); // 'light' | 'dark'
  const env   = isLocal ? 'local' : 'cloud';
  const bgSrc = BACKGROUND_MAP[`${theme}-${env}`];

  return (
    <div id="dashboard-layout" className={`relative flex h-screen w-full overflow-hidden ${themeClass}`}>

      {/* ── Background layer ─────────────────────────────────────────────
          Fixed so it never scrolls with file content.
          z-0 keeps it behind everything.
          pointer-events-none prevents any click interference.
      ──────────────────────────────────────────────────────────────── */}
      <img
        key={bgSrc}
        src={bgSrc}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      />
      {/* Subtle overlay to guarantee text contrast */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none bg-white/20 dark:bg-black/30" />

      {/* ── Existing UI — sits on top of the background layer ─────────── */}
      <Sidebar />
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
