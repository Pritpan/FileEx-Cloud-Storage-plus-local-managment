import { Cloud, Folder, Clock, Trash2, HardDrive, Settings } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { StorageBar } from './StorageBar';

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-surface-200 bg-surface-50 dark:bg-surface-900 dark:border-surface-800 h-screen hidden md:flex">
      {/* Logo Area */}
      <div className="h-14 flex items-center px-6 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <Cloud className="w-6 h-6 text-brand-600 dark:text-brand-500" />
          <span className="font-semibold text-lg text-surface-900 dark:text-surface-100 tracking-tight">Fileex</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <SidebarItem icon={Folder} label="My Files" to="/explorer" />
        <SidebarItem icon={Clock} label="Recent" disabled />
        <SidebarItem icon={Trash2} label="Trash" to="/trash" />
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
            System
          </p>
        </div>
        <SidebarItem icon={HardDrive} label="Storage" to="/storage" />
        <SidebarItem icon={Settings} label="Settings" to="/settings" disabled />
      </nav>

      {/* Storage Status */}
      <StorageBar />
    </aside>
  );
}
