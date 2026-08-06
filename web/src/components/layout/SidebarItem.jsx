import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function SidebarItem({ icon: Icon, label, to, disabled }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-surface-400 cursor-not-allowed">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive 
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400" 
            : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );
}
