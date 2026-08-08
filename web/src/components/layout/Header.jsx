import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useThemeStore, useUIStore } from '@/store';
import { authService } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useUIStore();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      queryClient.clear();
      clearAuth();
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="h-14 border-b border-surface-200 bg-surface-0 dark:bg-surface-900 dark:border-surface-800 flex items-center justify-between px-3 lg:px-4 shrink-0">
      {/* Left side empty or reserved for future elements */}
      <div className="flex items-center gap-2"></div>

      {/* Right — theme + user */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </Button>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 dark:focus-visible:ring-offset-surface-900">
            <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
              <AvatarImage src="" alt={user?.name || 'User'} />
              <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold text-sm">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-sm font-medium text-surface-800 dark:text-surface-200 max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-surface-500">
                  {user?.email || ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
