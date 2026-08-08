import { useState } from 'react';
import { Trash2, RotateCcw, Trash, Calendar, HardDrive, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getItemIcon, formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import { useTrash, useRestore } from '../hooks/useTrash';
import { DeleteForeverDialog } from '../components/DeleteForeverDialog';

// ── Empty State ──────────────────────────────────────────────────────────────
function TrashEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-24">
      <div className="p-6 rounded-full bg-surface-100 dark:bg-surface-800">
        <Trash2 className="w-12 h-12 text-surface-300 dark:text-surface-600" />
      </div>
      <div>
        <p className="text-base font-semibold text-surface-800 dark:text-surface-200">
          Trash is empty
        </p>
        <p className="text-sm text-surface-500 mt-1">
          Files you delete will appear here.
        </p>
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function TrashSkeleton() {
  return (
    <div className="px-6 py-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-md bg-surface-100 dark:bg-surface-800 animate-pulse" />
      ))}
    </div>
  );
}

// ── Error State ──────────────────────────────────────────────────────────────
function TrashErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-24">
      <p className="text-sm text-surface-500">Failed to load trash.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function TrashPage() {
  const { items, isLoading, isError, refetch } = useTrash();
  const { mutate: restore, isPending: isRestoring } = useRestore();

  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const openDeleteDialog = (item) => setDeleteDialog({ open: true, item });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, item: null });

  return (
    <div className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950 shrink-0">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-surface-500" />
          <div>
            <h1 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              Trash
            </h1>
            {!isLoading && !isError && (
              <p className="text-xs text-surface-500">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <TrashSkeleton />
        ) : isError ? (
          <TrashErrorState onRetry={refetch} />
        ) : items.length === 0 ? (
          <TrashEmptyState />
        ) : (
          <div className="px-6 py-4">
            <div className="border border-surface-200 dark:border-surface-800 rounded-md bg-surface-0 dark:bg-surface-900 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-surface-200 dark:border-surface-800">
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Deleted
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" /> Size
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1.5">
                        <FileType className="w-3.5 h-3.5" /> Type
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                    >
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getItemIcon(item, 'w-5 h-5')}
                          <span className="truncate max-w-[200px] text-sm font-medium text-surface-800 dark:text-surface-200">
                            {item.displayName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Deleted date */}
                      <TableCell className="text-sm text-surface-500 dark:text-surface-400">
                        {item.deletedAt ? formatDate(item.deletedAt) : '—'}
                      </TableCell>

                      {/* Size */}
                      <TableCell className="text-sm text-surface-500 dark:text-surface-400">
                        {item.type === 'FOLDER' ? '—' : formatBytes(item.size)}
                      </TableCell>

                      {/* Type badge */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal capitalize"
                        >
                          {item.type === 'FOLDER' ? 'Folder' : (item.mimeType?.split('/')[1] ?? 'file')}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restore(item.id)}
                            disabled={isRestoring}
                            className="h-8 px-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash className="w-3.5 h-3.5 mr-1.5" />
                            Delete forever
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <DeleteForeverDialog
        open={deleteDialog.open}
        onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}
        item={deleteDialog.item}
      />
    </div>
  );
}
