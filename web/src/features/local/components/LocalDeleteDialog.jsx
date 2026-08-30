/**
 * LocalDeleteDialog.jsx — E5: Local Explorer
 *
 * Permanently deletes a local file or directory using electronAPI.delete().
 * Uses AlertDialog for confirmation (same primitive as the cloud version).
 *
 * Note: this is a permanent delete, not a cloud Trash operation.
 * The dialog copy makes this explicit.
 */

import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

/**
 * @param {{ open, onOpenChange, item, onSuccess }} props
 */
export function LocalDeleteDialog({ open, onOpenChange, item, onSuccess }) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;
    const targetPath = item._local.path;

    setPending(true);
    try {
      const result = await window.electronAPI.delete(targetPath);
      if (result.success) {
        toast.success(`"${item.displayName}" deleted.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error?.message ?? 'Failed to delete.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{item?.displayName}&quot; will be permanently deleted from your local filesystem.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {pending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
