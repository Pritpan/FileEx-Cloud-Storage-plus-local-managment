import { AlertTriangle } from 'lucide-react';
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
import { useDeleteForever } from '../hooks/useTrash';

/**
 * DeleteForeverDialog — confirmation before permanent deletion.
 *
 * @param {{ open, onOpenChange, item }} props
 */
export function DeleteForeverDialog({ open, onOpenChange, item }) {
  const { mutate: deleteForever, isPending } = useDeleteForever();

  const handleConfirm = () => {
    if (!item) return;
    deleteForever(item.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pl-1">
            <strong className="text-surface-800 dark:text-surface-200">
              {item?.displayName}
            </strong>{' '}
            will be permanently deleted and cannot be recovered. This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
          >
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
