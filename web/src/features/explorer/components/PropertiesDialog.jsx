import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFileProperties } from '../hooks/useFileProperties';
import { formatBytes, formatDate, getItemIcon } from './ExplorerItem';

export function PropertiesDialog({ open, onOpenChange, item }) {
  const { data: properties, isLoading, isError } = useFileProperties(item?.id, open);

  // If we don't have the backend extended data yet, fallback to what we know from the list
  const displayData = properties || item;

  const isFile = displayData?.type !== 'FOLDER';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Properties</DialogTitle>
          <DialogDescription>
            {displayData?.displayName || 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {!displayData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500 text-center py-4">Failed to load properties.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
                {getItemIcon(displayData, 'w-12 h-12')}
                <div>
                  <h4 className="font-medium text-foreground dark:text-white break-all">{displayData.displayName}</h4>
                  <p className="text-sm text-surface-500">
                    {isFile ? 'File' : 'File Folder'}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
                <dt className="text-surface-500 font-medium">Type:</dt>
                <dd className="text-foreground dark:text-white truncate">
                  {isFile ? (displayData.mimeType || 'Unknown') : 'Folder'}
                </dd>

                {isFile && (
                  <>
                    <dt className="text-surface-500 font-medium">Size:</dt>
                    <dd className="text-foreground dark:text-white">
                      {formatBytes(displayData.size, 2)} ({displayData.size} bytes)
                    </dd>
                  </>
                )}

                <dt className="text-surface-500 font-medium">Created:</dt>
                <dd className="text-foreground dark:text-white">
                  {displayData.createdAt ? formatDate(displayData.createdAt) : '--'}
                </dd>

                <dt className="text-surface-500 font-medium">Modified:</dt>
                <dd className="text-foreground dark:text-white">
                  {displayData.updatedAt ? formatDate(displayData.updatedAt) : '--'}
                </dd>

                {isFile && (
                  <>
                    <dt className="text-surface-500 font-medium">Status:</dt>
                    <dd className="text-foreground dark:text-white">
                      {displayData.status || 'READY'}
                    </dd>
                  </>
                )}

                {!isFile && properties && (
                  <>
                    <dt className="text-surface-500 font-medium">Contains:</dt>
                    <dd className="text-foreground dark:text-white">
                      {properties.filesCount} Files, {properties.foldersCount} Folders
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
