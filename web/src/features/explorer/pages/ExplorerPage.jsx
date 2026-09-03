import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Cloud, HardDrive } from 'lucide-react';
import { Toolbar } from '../components/Toolbar';
import { BreadcrumbNav } from '../components/BreadcrumbNav';
import { ExplorerGrid } from '../components/ExplorerGrid';
import { ExplorerTable } from '../components/ExplorerTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { CreateFolderDialog } from '../components/CreateFolderDialog';
import { RenameDialog } from '../components/RenameDialog';
import { MoveDialog } from '../components/MoveDialog';
import { DeleteDialog } from '../components/DeleteDialog';
import { PropertiesDialog } from '../components/PropertiesDialog';
import { useFiles } from '../hooks/useFiles';
import { UploadDropzone } from '@/features/upload/components/UploadDropzone';
import { UploadQueue } from '@/features/upload/components/UploadQueue';
import { usePreview } from '@/features/preview/hooks/usePreview';
import { useDownload } from '@/features/preview/hooks/useDownload';
import { useTransfers } from '@/features/upload/hooks/useTransfers';
import { PreviewDialog } from '@/features/preview/components/PreviewDialog';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchResults } from '@/features/search/components/SearchResults';
import { useSort } from '../hooks/useSort';
import { sortFiles } from '@/utils/sortUtils';

export function ExplorerPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewModeState] = useState(() => {
    return localStorage.getItem('fileex-cloud-view-mode') || 'list';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem('fileex-cloud-view-mode', mode);
  };
  const [selectedItem, setSelectedItem] = useState(null);

  const currentFolderId = folderId ? parseInt(folderId, 10) : null;
  const breadcrumbs = location.state?.breadcrumbs || [{ id: 'root', label: 'My Files' }];

  const { files, isLoading, isError, error, refetch } = useFiles(currentFolderId);
  const errorMessage = error?.response?.data?.error?.message || error?.message;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);
  const isSearchMode = debouncedQuery.trim().length >= 2;
  const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError, isFetching: isSearchFetching } = useSearch(debouncedQuery);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameState, setRenameState] = useState({ open: false, item: null });
  const [moveState, setMoveState] = useState({ open: false, item: null });
  const [deleteState, setDeleteState] = useState({ open: false, item: null });
  const [propertiesState, setPropertiesState] = useState({ open: false, item: null });

  const handleRename = (item) => setRenameState({ open: true, item });
  const handleMove   = (item) => setMoveState({ open: true, item });
  const handleDelete = (item) => setDeleteState({ open: true, item });
  const handleProperties = (item) => setPropertiesState({ open: true, item });

  const { open: previewOpen, item: previewItem, previewUrl, isLoading: previewLoading, isError: previewError, openPreview, closePreview } = usePreview();
  const { downloadFile: browserDownload } = useDownload();
  const { downloadCloudToLocal, uploadLocalToCloud } = useTransfers();

  const { sortBy, direction, setSort } = useSort();

  const handleDownload = (item) => {
    if (window.electronAPI) downloadCloudToLocal(item, null);
    else browserDownload(item);
  };

  const handleDropItem = useCallback(async (e, cloudFolderItem) => {
    if (cloudFolderItem.type !== 'FOLDER') return;
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      if (data.type === 'LOCAL_FILE') {
        await uploadLocalToCloud(data.path, data.name, 'application/octet-stream', data.size, cloudFolderItem.id);
      }
    } catch (err) { console.error('Invalid drop data', err); }
  }, [uploadLocalToCloud]);

  const handleItemClick = (item) => setSelectedItem((prev) => prev?.id === item.id ? null : item);

  const handleItemDoubleClick = (item) => {
    if (item.type === 'FOLDER') {
      const newBreadcrumbs = [...breadcrumbs, { id: item.id, label: item.displayName }];
      navigate(`/explorer/${item.id}`, { state: { breadcrumbs: newBreadcrumbs } });
      setSearchQuery('');
      setSelectedItem(null);
    } else {
      openPreview(item);
    }
  };

  const handleBreadcrumbNavigate = (item, index) => {
    if (item.id === 'root') navigate('/explorer', { state: { breadcrumbs: [{ id: 'root', label: 'My Files' }] } });
    else navigate(`/explorer/${item.id}`, { state: { breadcrumbs: breadcrumbs.slice(0, index + 1) } });
    setSelectedItem(null);
  };

  const explorerActionProps = {
    onRename: handleRename, onMove: handleMove, onDelete: handleDelete,
    onProperties: handleProperties, onDoubleClick: handleItemDoubleClick,
    onPreview: openPreview, onDownload: handleDownload, onDropItem: handleDropItem,
    onItemClick: handleItemClick, selectedItem,
  };

  const renderBody = () => {
    const isTyping = searchQuery.trim().length > 0 && !isSearchMode;
    if (isTyping) return <LoadingSkeleton viewMode={viewMode} />;
    if (isSearchMode) {
      if (isSearchLoading) return <LoadingSkeleton viewMode={viewMode} />;
      if (isSearchError) return <ErrorState message="Search failed. Try again." onRetry={() => {}} />;
      const sortedSearch = sortFiles(searchResults ?? [], sortBy, direction);
      return <SearchResults query={debouncedQuery} results={sortedSearch} viewMode={viewMode} {...explorerActionProps} sortBy={sortBy} sortDirection={direction} onSortChange={setSort} />;
    }
    if (isLoading) return <LoadingSkeleton viewMode={viewMode} />;
    if (isError) return <ErrorState message={errorMessage} onRetry={refetch} />;
    if (files.length === 0) return <EmptyState onNewFolder={() => setCreateFolderOpen(true)} currentFolderId={currentFolderId} />;
    const sortedFiles = sortFiles(files, sortBy, direction);
    return viewMode === 'grid'
      ? <ExplorerGrid items={sortedFiles} {...explorerActionProps} />
      : <ExplorerTable items={sortedFiles} {...explorerActionProps} sortBy={sortBy} sortDirection={direction} onSortChange={setSort} />;
  };

  return (
    <div className="flex flex-col h-full w-full glass-workspace">
      {/* Workspace identity header */}
      <div className="glass-identity flex items-center gap-3 px-5 py-3 shrink-0">
        <Cloud className="w-5 h-5 text-[#5D82A6] dark:text-[#5D82A6] shrink-0" />
        <div>
          <h1 className="text-sm font-semibold text-[#5D82A6] dark:text-[#5D82A6] leading-tight">Cloud (Sky)</h1>
          <p className="text-[11px] text-foreground/80 dark:text-white/80 leading-tight">Browse and manage your cloud files</p>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewFolder={() => setCreateFolderOpen(true)}
        currentFolderId={currentFolderId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        isSearching={isSearchFetching && isSearchMode}
        selectedItem={selectedItem}
        sortBy={sortBy}
        sortDirection={direction}
        onSortChange={setSort}
      />

      {/* Breadcrumbs */}
      {!isSearchMode && (
        <BreadcrumbNav items={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
      )}

      {/* File workspace + details panel */}
      <UploadDropzone currentFolderId={currentFolderId}>
        <div className="grid grid-cols-[minmax(0,1fr)_20rem] flex-1 overflow-hidden min-h-0">
          {/* Main file area */}
          <div className="overflow-y-auto" onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}>
            {renderBody()}
          </div>

          {/* Details panel column — ALWAYS present so grid width doesn't change */}
          <div className="overflow-y-auto border-l border-black/10 dark:border-white/10">
            {selectedItem ? (
              <div className="p-3 flex flex-col gap-3">
                <div className="glass-card rounded-lg p-3 flex flex-col gap-3">
                  <div className="flex flex-col items-center gap-2 pt-1">
                  {/* Big icon */}
                  {selectedItem.type === 'FOLDER'
                    ? <HardDrive className="w-10 h-10" style={{ color: '#5D82A6' }} />
                    : <Cloud className="w-10 h-10" style={{ color: '#5D82A6' }} />
                  }
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground dark:text-white break-all leading-tight">{selectedItem.displayName}</p>
                    <p className="text-[11px] text-foreground/60 dark:text-white/60 mt-0.5">{selectedItem.type === 'FOLDER' ? 'File folder' : 'File'}</p>
                  </div>
                </div>
                <hr className="border-black/10 dark:border-white/10" />
                <dl className="flex flex-col gap-2 text-[11px]">
                  <div>
                    <dt className="text-foreground/50 dark:text-white/50 uppercase tracking-wide text-[10px]">Type</dt>
                    <dd className="text-foreground/80 dark:text-white/80 mt-0.5">{selectedItem.type === 'FOLDER' ? 'Folder' : 'File'}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/50 dark:text-white/50 uppercase tracking-wide text-[10px]">Modified</dt>
                    <dd className="text-foreground/80 dark:text-white/80 mt-0.5">{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleDateString() : '—'}</dd>
                  </div>
                  {selectedItem.type !== 'FOLDER' && (
                    <div>
                      <dt className="text-foreground/50 dark:text-white/50 uppercase tracking-wide text-[10px]">Size</dt>
                      <dd className="text-foreground/80 dark:text-white/80 mt-0.5">{selectedItem.size ? `${(selectedItem.size / 1024).toFixed(1)} KB` : '—'}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            ) : (
              <div className="p-3 flex flex-col gap-3 h-full pt-12">
                <div className="glass-card rounded-lg p-6 flex flex-col gap-3 items-center text-center">
                  <Cloud className="w-10 h-10 text-foreground/30 dark:text-white/30" />
                  <p className="text-[11px] text-foreground/70 dark:text-white/70">Select an item to view its details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </UploadDropzone>

      <UploadQueue />

      {/* Dialogs */}
      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} currentFolderId={currentFolderId} />
      <RenameDialog open={renameState.open} onOpenChange={(open) => setRenameState((s) => ({ ...s, open }))} item={renameState.item} currentFolderId={currentFolderId} />
      <MoveDialog open={moveState.open} onOpenChange={(open) => setMoveState((s) => ({ ...s, open }))} item={moveState.item} currentFolderId={currentFolderId} />
      <DeleteDialog open={deleteState.open} onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))} item={deleteState.item} currentFolderId={currentFolderId} />
      <PropertiesDialog open={propertiesState.open} onOpenChange={(open) => setPropertiesState((s) => ({ ...s, open }))} item={propertiesState.item} />
      <PreviewDialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }} item={previewItem} previewUrl={previewUrl} isLoading={previewLoading} isError={previewError} />
    </div>
  );
}
