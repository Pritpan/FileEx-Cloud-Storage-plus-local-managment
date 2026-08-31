import { Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useThemeStore } from '@/store';
import { authService } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
};

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try { await authService.logout(); } catch (e) { /* swallow */ }
    finally {
      queryClient.clear();
      clearAuth();
      toast.success('Logged out successfully');
    }
  };

  return (
    <header className="h-12 border-b border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 flex items-center justify-end px-4 shrink-0 gap-2">
      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 text-surface-400 hover:text-surface-600 dark:hover:text-surface-100"
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      {/* User avatar + dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-brand-500">
          <Avatar className="h-7 w-7 hover:opacity-80 transition-opacity">
            <AvatarImage src="" alt={user?.name || 'User'} />
            <AvatarFallback className="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-semibold text-xs">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:block text-sm font-medium text-surface-600 dark:text-surface-100 max-w-[100px] truncate">
            {user?.name || 'User'}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
