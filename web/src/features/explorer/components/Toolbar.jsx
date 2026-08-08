import { FolderPlus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadButton } from '@/features/upload/components/UploadButton';
import { SearchBar } from '@/features/search/components/SearchBar';

/**
 * Toolbar — top action bar for the explorer.
 *
 * @param {{ viewMode, setViewMode, onNewFolder, currentFolderId, searchQuery, onSearchChange, onSearchClear, isSearching }} props
 */
export function Toolbar({
  viewMode,
  setViewMode,
  onNewFolder,
  currentFolderId,
  searchQuery,
  onSearchChange,
  onSearchClear,
  isSearching,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950">
      <div className="flex items-center gap-2">
        <UploadButton currentFolderId={currentFolderId} />
        <Button variant="outline" onClick={onNewFolder} className="text-surface-900 dark:text-surface-100 dark:hover:text-white">
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <SearchBar
          query={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
          isLoading={isSearching}
        />

        <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-md p-1 bg-surface-50 dark:bg-surface-900">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 text-surface-700 dark:text-surface-300" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4 text-surface-700 dark:text-surface-300" />
          </Button>
        </div>
      </div>
    </div>
  );
}
