import { NavLink, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
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
  const navigate = useNavigate();
  const hoverTimeout = useRef(null);

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

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
        
        // Start timer if not already running
        if (!hoverTimeout.current) {
          hoverTimeout.current = setTimeout(() => {
            navigate(to);
            hoverTimeout.current = null;
          }, 600);
        }
      }}
      onDragLeave={clearHoverTimeout}
      onDragEnd={clearHoverTimeout}
      onDrop={(e) => {
        e.preventDefault();
        clearHoverTimeout();
      }}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors font-medium',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-brand-100/80 text-brand-700 dark:bg-brand-900/80 dark:text-brand-300 font-semibold shadow-sm'
            : 'text-foreground/90 hover:bg-black/10 hover:text-foreground dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white',
        )
      }
    >
      <Icon className="w-5 h-5 shrink-0 pointer-events-none" />
      {!collapsed && <span className="truncate pointer-events-none">{label}</span>}
    </NavLink>
  );
}
