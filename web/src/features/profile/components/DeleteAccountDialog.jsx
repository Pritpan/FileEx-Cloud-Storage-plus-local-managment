import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { authService } from '@/features/auth';
import { useAuthStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';

export function DeleteAccountDialog({ open, onOpenChange }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isDeleting) {
      setConfirmationText('');
      onOpenChange(false);
    } else if (newOpen) {
      onOpenChange(true);
    }
  };

  const handleDelete = async () => {
    if (confirmationText.trim().toLowerCase() !== 'delete') return;

    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      queryClient.clear();
      clearAuth();
      toast.success('Account deleted successfully');
      // No need to redirect manually if clearAuth drops the user out of the protected route
    } catch (error) {
      toast.error('Failed to delete account. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmed = confirmationText.trim().toLowerCase() === 'delete';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/80 dark:text-white/80">
            This action is permanent and cannot be undone. All your files, folders, and personal data will be permanently wiped from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-foreground dark:text-surface-100">
              Please type <span className="font-bold font-mono select-none">delete</span> to confirm.
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="delete"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
