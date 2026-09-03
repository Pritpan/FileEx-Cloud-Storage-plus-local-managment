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
  sortBy,
  sortDirection,
  onSortChange,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm border border-white/20 dark:border-white/10">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <SearchX className="w-10 h-10 text-surface-500 dark:text-surface-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
            No results for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
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
    sortBy,
    sortDirection,
    onSortChange,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Result count badge */}
      <div className="px-6 pt-4 pb-1">
        <p className="text-xs opacity-60 text-foreground dark:text-white">
          {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium opacity-90 text-foreground dark:text-white">
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
