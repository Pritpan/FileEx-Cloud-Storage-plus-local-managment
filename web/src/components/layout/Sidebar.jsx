import { Cloud, HardDrive, Settings, Clock, Trash2, Monitor, Layers } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { StorageBar } from './StorageBar';
import { useUIStore } from '@/store';

/**
 * Sidebar — collapsible navigation.
 * Expanded: w-64 icons + labels.
 * Collapsed: w-14 icons only.
 */
export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`
        glass-sidebar
        flex-shrink-0 flex flex-col
        h-screen hidden md:flex overflow-hidden
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div
        className="h-12 flex items-center border-b border-black/10 dark:border-white/10 shrink-0 px-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={toggleSidebar}
      >
        <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}>
          <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-base text-foreground dark:text-white tracking-tight truncate">
              Fileex
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">

        {/* WORKSPACE section */}
        {!collapsed && (
          <div className="pb-1 px-2">
            <p className="text-[10px] font-bold text-foreground/70 dark:text-white/70 uppercase tracking-widest">
              Workspace
            </p>
          </div>
        )}

        {/* Local — Electron only */}
        {window.electronAPI && (
          <SidebarItem icon={Monitor} label="Local (Earth)" to="/local" collapsed={collapsed} />
        )}

        {/* Cloud — replaces old "My Files" */}
        <SidebarItem icon={Cloud} label="Cloud (Sky)" to="/explorer" collapsed={collapsed} />

        {/* MY CLOUD section */}
        {!collapsed && (
          <div className="pt-4 pb-1 px-2">
            <p className="text-[10px] font-bold text-foreground/70 dark:text-white/70 uppercase tracking-widest">
              Cloud
            </p>
          </div>
        )}
        {collapsed && <div className="pt-2" />}

        <SidebarItem icon={Clock}  label="Recent" to="/recent"  collapsed={collapsed} />
        <SidebarItem icon={Trash2} label="Trash"  to="/trash"   collapsed={collapsed} />

        {/* SYSTEM section */}
        {!collapsed && (
          <div className="pt-4 pb-1 px-2">
            <p className="text-[10px] font-bold text-foreground/70 dark:text-white/70 uppercase tracking-widest">
              System
            </p>
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
