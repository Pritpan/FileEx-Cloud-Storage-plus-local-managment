import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteFile } from '../hooks/useDeleteFile';

/**
 * DeleteDialog — confirmation dialog for soft-deleting (trashing) an item.
 *
 * @param {{ open, onOpenChange, item, currentFolderId }} props
 */
export function DeleteDialog({ open, onOpenChange, item, currentFolderId }) {
  const mutation = useDeleteFile(currentFolderId);

  const handleConfirm = () => {
    mutation.mutate(
      { id: item.id },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{item?.displayName}&quot; will be moved to Trash.
            You can restore it from the Trash at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {mutation.isPending ? 'Deleting…' : 'Move to Trash'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
