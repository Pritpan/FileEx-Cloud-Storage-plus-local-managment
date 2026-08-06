import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

/**
 * DashboardLayout — Layout wrapper for all authenticated pages.
 */
function DashboardLayout() {
  return (
    <div id="dashboard-layout" className="flex h-screen w-full overflow-hidden bg-surface-0 dark:bg-surface-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
