import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoveFile } from '../hooks/useMoveFile';
import { useFiles } from '../hooks/useFiles';

/**
 * FolderPickerItem — a single selectable folder row.
 */
function FolderPickerItem({ folder, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(folder.id)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left',
        selected
          ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300'
          : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
      )}
    >
      <Folder className="w-4 h-4 text-brand-500 fill-brand-100 dark:fill-brand-900/30 flex-shrink-0" />
      <span className="truncate">{folder.displayName}</span>
    </button>
  );
}

/**
 * MoveDialog — dialog for moving a file or folder.
 *
 * Shows all folders at the root level as move destinations.
 * MVP: shallow picker (root folders only). Future: recursive tree.
 *
 * @param {{ open, onOpenChange, item, currentFolderId }} props
 */
export function MoveDialog({ open, onOpenChange, item, currentFolderId }) {
  const [destinationId, setDestinationId] = useState(null);
  const mutation = useMoveFile(currentFolderId);

  // Fetch root folders to use as destination options
  const { files: rootItems, isLoading } = useFiles(null);
  const availableFolders = rootItems.filter(
    (f) => f.type === 'FOLDER' && f.id !== item?.id
  );

  const handleConfirm = () => {
    mutation.mutate(
      { id: item.id, parentId: destinationId },
      {
        onSuccess: () => {
          setDestinationId(null);
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) setDestinationId(null);
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Move Item</DialogTitle>
          <DialogDescription>
            Choose a destination for &quot;{item?.displayName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="border border-surface-200 dark:border-surface-800 rounded-md overflow-hidden max-h-64 overflow-y-auto">
            {/* Root option */}
            <button
              type="button"
              onClick={() => setDestinationId(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left border-b border-surface-200 dark:border-surface-800',
                destinationId === null
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
              )}
            >
              <Home className="w-4 h-4 text-surface-500 flex-shrink-0" />
              <span className="font-medium">My Files (Root)</span>
            </button>

            {isLoading && (
              <div className="px-4 py-6 text-center text-sm text-surface-500">
                Loading folders…
              </div>
            )}

            {!isLoading && availableFolders.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-surface-500">
                No other folders available.
              </div>
            )}

            {availableFolders.map((folder) => (
              <FolderPickerItem
                key={folder.id}
                folder={folder}
                selected={destinationId === folder.id}
                onSelect={setDestinationId}
              />
            ))}
          </div>
        </div>

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
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            {mutation.isPending ? 'Moving…' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
