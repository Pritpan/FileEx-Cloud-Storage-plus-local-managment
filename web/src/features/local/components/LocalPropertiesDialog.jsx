/**
 * LocalPropertiesDialog.jsx — E5: Local Explorer
 *
 * Displays metadata for a local file or folder using electronAPI.getFileMetadata().
 * Reuses the same Dialog shell and layout as the cloud PropertiesDialog, but
 * reads from the E4 API instead of the cloud backend.
 */

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatBytes, formatDate, getItemIcon } from '@/features/explorer/components/ExplorerItem';

/**
 * @param {{ open, onOpenChange, item }} props
 *   item — adapted local entry; item._local.path is the full path
 */
export function LocalPropertiesDialog({ open, onOpenChange, item }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(false);

  useEffect(() => {
    if (!open || !item || !window.electronAPI) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setMetadata(null);

    window.electronAPI.getFileMetadata(item._local.path).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setMetadata(result.data);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [open, item]);

  const displayData = metadata;
  const isFile = displayData?.type !== 'folder';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Properties</DialogTitle>
          <DialogDescription>{item?.displayName || 'Loading...'}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center py-4">Failed to load properties.</p>
          )}

          {!loading && !error && displayData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
                {getItemIcon(item, 'w-12 h-12')}
                <div>
                  <h4 className="font-medium text-surface-900 dark:text-surface-100 break-all">
                    {displayData.name}
                  </h4>
                  <p className="text-sm text-surface-500">
                    {isFile ? 'File' : 'File Folder'}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
                <dt className="text-surface-500 font-medium">Location:</dt>
                <dd className="text-surface-900 dark:text-surface-100 truncate" title={displayData.path}>
                  {displayData.path}
                </dd>

                <dt className="text-surface-500 font-medium">Type:</dt>
                <dd className="text-surface-900 dark:text-surface-100">
                  {isFile ? 'File' : 'Folder'}
                </dd>

                {isFile && (
                  <>
                    <dt className="text-surface-500 font-medium">Size:</dt>
                    <dd className="text-surface-900 dark:text-surface-100">
                      {formatBytes(displayData.size, 2)} ({displayData.size} bytes)
                    </dd>
                  </>
                )}

                <dt className="text-surface-500 font-medium">Created:</dt>
                <dd className="text-surface-900 dark:text-surface-100">
                  {displayData.createdAt ? formatDate(displayData.createdAt) : '--'}
                </dd>

                <dt className="text-surface-500 font-medium">Modified:</dt>
                <dd className="text-surface-900 dark:text-surface-100">
                  {displayData.modifiedAt ? formatDate(displayData.modifiedAt) : '--'}
                </dd>
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
