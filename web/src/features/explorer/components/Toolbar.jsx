import { FolderPlus, LayoutGrid, List, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadButton } from '@/features/upload/components/UploadButton';
import { SearchBar } from '@/features/search/components/SearchBar';
import { useTransfers } from '@/features/upload/hooks/useTransfers';

/**
 * Toolbar — compact action bar for the Cloud explorer.
 * Left:  [ + New Folder ]  [ ↑ Upload ]
 * Right: [ ↓ Download to Local ]  [ list/grid toggle ]  [ search ]
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
  selectedItem,
}) {
  const { downloadCloudToLocal } = useTransfers();
  const canDownload = selectedItem && selectedItem.type !== 'FOLDER' && window.electronAPI;

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-4 border-b border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shrink-0">
      {/* Left actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewFolder}
          className="text-sm"
        >
          <FolderPlus className="w-4 h-4 mr-1.5" />
          New Folder
        </Button>
        <UploadButton currentFolderId={currentFolderId} />
      </div>

      {/* Right: destination action + view controls + search */}
      <div className="flex items-center gap-2">
        {/* Download to Local — only in Electron, Sky→Earth destination */}
        {window.electronAPI && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => canDownload && downloadCloudToLocal(selectedItem, null)}
            disabled={!canDownload}
            className="text-sm border-earth-600/40 text-earth-600 hover:bg-earth-50 hover:text-earth-600 dark:text-earth-400 dark:hover:bg-earth-900/40 disabled:opacity-40"
            title={selectedItem ? `Download "${selectedItem?.displayName}" to Local` : 'Select a file first'}
          >
            <Download className="w-4 h-4 mr-1.5" />
            {selectedItem && selectedItem.type !== 'FOLDER'
              ? `Download "${selectedItem.displayName}"`
              : 'Download to Local'}
          </Button>
        )}

        <SearchBar
          query={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
          isLoading={isSearching}
        />

        <div className="flex items-center border border-surface-300 dark:border-surface-700 rounded-md p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-400' : 'text-surface-500'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-400' : 'text-surface-500'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
