import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFolder } from '../hooks/useCreateFolder';
import { useForm } from 'react-hook-form';

/**
 * CreateFolderDialog — dialog for creating a new folder.
 *
 * @param {{ open, onOpenChange, currentFolderId }} props
 */
export function CreateFolderDialog({ open, onOpenChange, currentFolderId }) {
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm({
    defaultValues: { displayName: '' },
  });

  const mutation = useCreateFolder(currentFolderId);

  // Focus the input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => setFocus('displayName'), 50);
    }
  }, [open, setFocus]);

  const onSubmit = ({ displayName }) => {
    mutation.mutate(
      { displayName: displayName.trim() },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
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
          <DialogDescription>
            Enter a name for the new folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="create-folder-form">
          <div className="py-4">
            <Label htmlFor="folder-name" className="text-sm font-medium mb-2 block">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g. My Project"
              autoComplete="off"
              className="text-surface-900 dark:text-surface-100"
              {...register('displayName', {
                required: 'Folder name is required.',
                maxLength: { value: 255, message: 'Name must not exceed 255 characters.' },
                validate: (v) => v.trim().length > 0 || 'Folder name cannot be empty.',
              })}
            />
            {errors.displayName && (
              <p className="text-xs text-red-500 mt-1.5">{errors.displayName.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-folder-form"
            disabled={mutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            {mutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
