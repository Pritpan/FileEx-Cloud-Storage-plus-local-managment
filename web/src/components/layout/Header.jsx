import { LogOut, Search } from 'lucide-react';
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
import { useAuthStore } from '@/store';
import { authService } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      queryClient.clear(); // Clear all cached data
      clearAuth(); // Remove user and token
      toast.success('Logged out successfully');
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 border-b border-surface-200 bg-surface-0 dark:bg-surface-900 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6">
      {/* Search / Context Area */}
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile menu trigger could go here later */}
      </div>

      {/* User Area */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-offset-surface-0 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
              <AvatarImage src="" alt={user?.name || "User"} />
              <AvatarFallback className="bg-brand-100 text-brand-700">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
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
