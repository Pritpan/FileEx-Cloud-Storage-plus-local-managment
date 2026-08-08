import { useState } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

/**
 * EditProfileDialog
 *
 * A dialog for editing name and profile picture.
 *
 * @param {{ open, onOpenChange, profile }} props
 */
export function EditProfileDialog({ open, onOpenChange, profile }) {
  const [name, setName] = useState(profile?.name || '');
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const handleSave = () => {
    updateProfile(
      { name },
      {
        onSuccess: () => {
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name and profile picture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Avatar display only */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-surface-100 dark:border-surface-800">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl bg-brand-100 text-brand-700 font-bold">
                  {getInitials(name || profile?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-xs text-surface-500">Avatar upload coming soon.</p>
          </div>

          <Separator />

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isPending}
            />
          </div>

          {/* Email — read only */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-surface-500">Email cannot be changed.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
