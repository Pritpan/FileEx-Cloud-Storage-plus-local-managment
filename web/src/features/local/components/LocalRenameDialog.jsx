/**
 * LocalRenameDialog.jsx — E5: Local Explorer
 *
 * Renames a local file or folder using electronAPI.rename().
 * Visual shell is identical to the cloud RenameDialog.
 */

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

/**
 * @param {{ open, onOpenChange, item, onSuccess }} props
 *   item — the adapted local item; item._local.path is the full path
 */
export function LocalRenameDialog({ open, onOpenChange, item, onSuccess }) {
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open && item) {
      reset({ name: item.displayName });
      setTimeout(() => setFocus('name'), 50);
    }
  }, [open, item, reset, setFocus]);

  const onSubmit = async ({ name }) => {
    const oldPath = item._local.path;
    const newName = name.trim();

    // If the name is unchanged, just close without calling IPC
    if (newName === item.displayName) { onOpenChange(false); return; }

    setPending(true);
    try {
      // Use renameInPlace — Main builds the new path using path.dirname + path.join.
      // React never needs to know or manipulate OS path separators.
      const result = await window.electronAPI.renameInPlace(oldPath, newName);
      if (result.success) {
        toast.success(`Renamed to "${newName}".`);
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error?.message ?? 'Failed to rename.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setPending(false);
    }
  };


  const handleOpenChange = (isOpen) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{item?.displayName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="local-rename-form">
          <div className="py-4">
            <Label htmlFor="local-rename-input" className="text-sm font-medium mb-2 block">
              New Name
            </Label>
            <Input
              id="local-rename-input"
              autoComplete="off"
              className="text-surface-900 dark:text-surface-100"
              {...register('name', {
                required: 'Name is required.',
                maxLength: { value: 255, message: 'Name must not exceed 255 characters.' },
                validate: (v) => v.trim().length > 0 || 'Name cannot be empty.',
              })}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="local-rename-form" disabled={pending} className="bg-brand-600 hover:bg-brand-700 text-white">
            {pending ? 'Renaming…' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
