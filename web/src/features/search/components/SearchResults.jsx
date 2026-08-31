import { SearchX, AlertTriangle } from 'lucide-react';
import { ExplorerGrid } from '@/features/explorer/components/ExplorerGrid';
import { ExplorerTable } from '@/features/explorer/components/ExplorerTable';

/**
 * SearchResults — renders the search result list in place of the regular file explorer.
 *
 * Props:
 *   query        (string)   — the active search query (for display)
 *   results      (object[]) — array of file/folder items
 *   isError      (boolean)
 *   viewMode     ('grid'|'list')
 *   onDoubleClick, onRename, onMove, onDelete, onPreview, onDownload — same as Explorer
 */
export function SearchResults({
  query,
  results,
  isError,
  viewMode,
  onDoubleClick,
  onRename,
  onMove,
  onDelete,
  onPreview,
  onDownload,
}) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
        <AlertTriangle className="w-10 h-10 text-danger" />
        <p className="text-sm text-surface-500">
          Search failed. Please check your connection and try again.
        </p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
        <SearchX className="w-10 h-10 text-surface-400 dark:text-surface-500" />
        <div>
          <p className="text-sm font-medium text-surface-600 dark:text-surface-100">
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-surface-400 mt-1">
            Try a different name or check your spelling.
          </p>
        </div>
      </div>
    );
  }

  const sharedProps = {
    items: results,
    onDoubleClick,
    onRename,
    onMove,
    onDelete,
    onPreview,
    onDownload,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Result count badge */}
      <div className="px-6 pt-4 pb-1">
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium text-surface-600 dark:text-surface-100">
            &ldquo;{query}&rdquo;
          </span>
        </p>
      </div>
      {viewMode === 'grid' ? (
        <ExplorerGrid {...sharedProps} />
      ) : (
        <ExplorerTable {...sharedProps} />
      )}
    </div>
  );
}
