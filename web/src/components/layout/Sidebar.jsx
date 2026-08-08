import { Cloud, Folder, Clock, Trash2, HardDrive, Settings } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { StorageBar } from './StorageBar';
import { useUIStore } from '@/store';

/**
 * Sidebar
 *
 * Collapsible navigation sidebar.
 *  - Expanded  (default):  w-64, icons + labels
 *  - Collapsed:            w-14, icons only + native title tooltips
 *
 * Width transition is driven by CSS transition-all duration-200.
 * State lives in useUIStore so the Header toggle button works too.
 */
export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col border-r border-surface-200
        bg-surface-50 dark:bg-surface-900 dark:border-surface-800
        h-screen hidden md:flex overflow-hidden
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-14' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div 
        className="h-14 flex items-center border-b border-surface-200 dark:border-surface-800 shrink-0 px-4 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
        onClick={toggleSidebar}
      >
        <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}>
          <Cloud className="w-5 h-5 text-brand-600 dark:text-brand-500 shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-lg text-surface-900 dark:text-surface-100 tracking-tight truncate">
              Fileex
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <SidebarItem icon={Folder}    label="My Files" to="/explorer" collapsed={collapsed} />
        <SidebarItem icon={Clock}     label="Recent"   to="/recent"   collapsed={collapsed} />
        <SidebarItem icon={Trash2}    label="Trash"    to="/trash"    collapsed={collapsed} />

        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">System</p>
          </div>
        )}
        {collapsed && <div className="pt-2" />}

        <SidebarItem icon={HardDrive} label="Storage"  to="/storage"  collapsed={collapsed} />
        <SidebarItem icon={Settings}  label="Settings" to="/settings" collapsed={collapsed} />
      </nav>

      {/* Storage bar */}
      <StorageBar collapsed={collapsed} />
    </aside>
  );
}
