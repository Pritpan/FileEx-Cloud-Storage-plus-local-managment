import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * SidebarItem
 *
 * Renders a navigation link. When `collapsed` is true the label is hidden
 * and the icon is centred. A native `title` tooltip shows the label on hover.
 *
 * @param {{ icon, label, to, disabled, collapsed }} props
 */
export function SidebarItem({ icon: Icon, label, to, disabled, collapsed }) {
  if (disabled) {
    return (
      <div
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-surface-400 cursor-not-allowed',
          collapsed && 'justify-center px-2',
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
        )
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
