import { useState } from 'react';
import {
  User, Mail, Calendar, HardDrive, LogOut, Loader2,
  Shield, Bell, Palette, Info, Pencil, Moon, Sun,
} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useStorage } from '@/features/storage/hooks/useStorage';
import { useAuthStore, useThemeStore } from '@/store';
import { authService } from '@/features/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import { EditProfileDialog } from '../components/EditProfileDialog';
import { DeleteAccountDialog } from '../components/DeleteAccountDialog';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export function SettingsPage() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { stats, isLoading: statsLoading } = useStorage();
  const { clearAuth } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      queryClient.clear();
      clearAuth();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-surface-400" />
      </div>
    );
  }

  const { totalBytes = 104857600, usedBytes = 0 } = stats || {};
  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full w-full glass-workspace overflow-y-auto">
      {/* ── Page Header ── */}
      <div className="px-8 py-8 glass-identity shrink-0">
        <h1 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3">
          <User className="w-7 h-7 text-brand-600 dark:text-brand-500" />
          Profile & Settings
        </h1>
        <p className="text-foreground/60 dark:text-white/60 mt-2">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-8 pb-20">

        {/* ── Profile Card ── */}
        <Card className="glass-card shadow-sm border-none overflow-hidden">
          <CardContent className="px-8 pb-8 pt-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 shadow-sm">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl bg-brand-100 text-brand-600 font-bold">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-foreground dark:text-white truncate">
                  {profile?.name || 'FileEX User'}
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-foreground/60 dark:text-white/60 text-sm font-medium">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{profile?.email || '—'}</span>
                  </span>
                  <span className="hidden md:inline text-surface-300 dark:text-surface-600">•</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-4 h-4" />
                    Member since {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-brand-600" /> Storage Plan
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60 dark:text-white/60">Current Plan</span>
                    <Badge variant="secondary" className="bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">Free Tier</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60 dark:text-white/60">Storage Used</span>
                    <span className="text-sm font-medium text-foreground dark:text-white">
                      {formatBytes(usedBytes)} / {formatBytes(totalBytes)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" /> Security Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60 dark:text-white/60">Password</span>
                    <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60 dark:text-white/60">Two-Factor Auth</span>
                    <Badge variant="outline" className="text-surface-500 border-surface-200 dark:border-surface-700">Disabled</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Settings Sections ── */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground dark:text-white">Application Settings</h2>

          {/* Appearance */}
          <Card className="glass-card shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-surface-500" /> Appearance
              </CardTitle>
              <CardDescription>Customize how FileEX looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark
                    ? <Moon className="w-5 h-5 text-indigo-400" />
                    : <Sun className="w-5 h-5 text-amber-500" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-white">Dark Mode</p>
                    <p className="text-sm text-foreground/60 dark:text-white/60">
                      Currently using <span className="font-medium">{isDark ? 'dark' : 'light'}</span> theme.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-surface-500" /> Notifications
              </CardTitle>
              <CardDescription>Manage your email and push notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Email Alerts', desc: 'Receive emails about your account activity.' },
                { label: 'Storage Warnings', desc: 'Get notified when you are near your storage limit.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{label}</p>
                    <p className="text-sm text-foreground/60 dark:text-white/60">{desc}</p>
                  </div>
                  <Switch disabled checked />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* About */}
          <Card className="glass-card shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-surface-500" /> About
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['Application', 'FileEX'],
                ['Version', 'v1.0.0-beta'],
              ].map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/60 dark:text-white/60">{key}</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card shadow-sm border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground dark:text-white">Log out</p>
                  <p className="text-sm text-foreground/60 dark:text-white/60">Sign out from your current session.</p>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900/30"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <LogOut className="w-4 h-4 mr-2" />
                  }
                  Log Out
                </Button>
              </div>

              <Separator className="my-5 border-red-200/50 dark:border-red-900/30" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground dark:text-white">Delete account</p>
                  <p className="text-sm text-foreground/60 dark:text-white/60">Permanently delete your account and all files.</p>
                </div>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
