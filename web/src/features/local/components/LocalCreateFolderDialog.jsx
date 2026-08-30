/**
 * LocalCreateFolderDialog.jsx — E5: Local Explorer
 *
 * Creates a new directory using electronAPI.createDirectory().
 * Visual shell is identical to the cloud CreateFolderDialog.
 * The only difference is the data source (electronAPI vs TanStack Query mutation).
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
 * @param {{ open, onOpenChange, currentPath, onSuccess }} props
 *   currentPath — the directory in which to create the folder
 *   onSuccess   — callback fired after successful creation (triggers refresh)
 */
export function LocalCreateFolderDialog({ open, onOpenChange, currentPath, onSuccess }) {
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm({
    defaultValues: { name: '' },
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) setTimeout(() => setFocus('name'), 50);
  }, [open, setFocus]);

  const onSubmit = async ({ name }) => {
    if (!currentPath) return;
    const folderName = name.trim();

    setPending(true);
    try {
      // createIn lets Main build the path safely using path.join.
      // React never needs to manipulate OS path separators.
      const result = await window.electronAPI.createIn(currentPath, folderName);
      if (result.success) {
        toast.success(`Folder "${folderName}" created.`);
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error?.message ?? 'Failed to create folder.');
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
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>Enter a name for the new folder.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="local-create-folder-form">
          <div className="py-4">
            <Label htmlFor="local-folder-name" className="text-sm font-medium mb-2 block">
              Folder Name
            </Label>
            <Input
              id="local-folder-name"
              placeholder="e.g. My Project"
              autoComplete="off"
              className="text-surface-900 dark:text-surface-100"
              {...register('name', {
                required: 'Folder name is required.',
                maxLength: { value: 255, message: 'Name must not exceed 255 characters.' },
                validate: (v) => v.trim().length > 0 || 'Folder name cannot be empty.',
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
          <Button type="submit" form="local-create-folder-form" disabled={pending} className="bg-brand-600 hover:bg-brand-700 text-white">
            {pending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
