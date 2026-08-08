import { useEffect } from 'react';
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
import { useRenameFile } from '../hooks/useRenameFile';
import { useForm } from 'react-hook-form';

/**
 * RenameDialog — dialog for renaming a file or folder.
 *
 * @param {{ open, onOpenChange, item, currentFolderId }} props
 *   item — the file/folder being renamed { id, displayName }
 */
export function RenameDialog({ open, onOpenChange, item, currentFolderId }) {
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm();

  const mutation = useRenameFile(currentFolderId);

  // Populate the input with the current name when dialog opens
  useEffect(() => {
    if (open && item) {
      reset({ displayName: item.displayName });
      setTimeout(() => setFocus('displayName'), 50);
    }
  }, [open, item, reset, setFocus]);

  const onSubmit = ({ displayName }) => {
    mutation.mutate(
      { id: item.id, displayName: displayName.trim() },
      {
        onSuccess: () => {
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
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{item?.displayName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="rename-form">
          <div className="py-4">
            <Label htmlFor="rename-input" className="text-sm font-medium mb-2 block">
              New Name
            </Label>
            <Input
              id="rename-input"
              autoComplete="off"
              {...register('displayName', {
                required: 'Name is required.',
                maxLength: { value: 255, message: 'Name must not exceed 255 characters.' },
                validate: (v) => v.trim().length > 0 || 'Name cannot be empty.',
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
            form="rename-form"
            disabled={mutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            {mutation.isPending ? 'Renaming…' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
