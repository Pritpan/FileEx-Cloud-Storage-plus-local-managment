import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = '' }) {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={[
        'inline-flex items-center justify-center w-8 h-8 rounded-md',
        'text-muted hover:text-text',
        'hover:bg-surface-2 transition-colors duration-150',
        'cursor-pointer border-0 bg-transparent',
        className,
      ].join(' ')}
    >
      {dark
        ? <Sun  size={16} aria-hidden="true" />
        : <Moon size={16} aria-hidden="true" />
      }
    </button>
  );
}
