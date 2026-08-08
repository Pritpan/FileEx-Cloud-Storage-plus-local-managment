import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store';
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
import { PreviewDialog } from '@/features/preview/components/PreviewDialog';
import { useSearch } from '@/features/search/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchResults } from '@/features/search/components/SearchResults';

export function ExplorerPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState('grid');
  const setUploadDrawerOpen = useUIStore((s) => s.setUploadDrawerOpen);

  // folderId from URL param is always a string; convert to number or null for root.
  const currentFolderId = folderId ? parseInt(folderId, 10) : null;

  // Derive breadcrumbs from location state, defaulting to root if missing (e.g. direct URL visit)
  const breadcrumbs = location.state?.breadcrumbs || [{ id: 'root', label: 'My Files' }];

  const { files, isLoading, isError, error, refetch } = useFiles(currentFolderId);

  const errorMessage = error?.response?.data?.error?.message || error?.message;

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  // Debounce 400ms to avoid a request on every single keystroke
  const debouncedQuery = useDebounce(searchQuery, 400);
  // Only enter search mode when at least 2 characters are typed
  const isSearchMode = debouncedQuery.trim().length >= 2;

  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
    isFetching: isSearchFetching,
  } = useSearch(debouncedQuery);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // For item-specific dialogs, track both open state and the target item
  const [renameState, setRenameState] = useState({ open: false, item: null });
  const [moveState, setMoveState] = useState({ open: false, item: null });
  const [deleteState, setDeleteState] = useState({ open: false, item: null });
  const [propertiesState, setPropertiesState] = useState({ open: false, item: null });

  // ── Action handlers (passed down to grid/table) ───────────────────────────
  const handleRename = (item) => setRenameState({ open: true, item });
  const handleMove = (item) => setMoveState({ open: true, item });
  const handleDelete = (item) => setDeleteState({ open: true, item });
  const handleProperties = (item) => setPropertiesState({ open: true, item });

  // ── Preview & Download ────────────────────────────────────────────────────
  const { open: previewOpen, item: previewItem, previewUrl, isLoading: previewLoading, isError: previewError, openPreview, closePreview } = usePreview();
  const { downloadFile } = useDownload();

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleItemDoubleClick = (item) => {
    if (item.type === 'FOLDER') {
      // When navigating from search results we still push to the folder URL.
      const newBreadcrumbs = [...breadcrumbs, { id: item.id, label: item.displayName }];
      navigate(`/explorer/${item.id}`, { state: { breadcrumbs: newBreadcrumbs } });
      // Clear search so user lands in the folder view
      setSearchQuery('');
    } else {
      openPreview(item);
    }
  };

  const handleBreadcrumbNavigate = (item, index) => {
    if (item.id === 'root') {
      navigate('/explorer', { state: { breadcrumbs: [{ id: 'root', label: 'My Files' }] } });
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      navigate(`/explorer/${item.id}`, { state: { breadcrumbs: newBreadcrumbs } });
    }
  };

  // Shared props for both normal and search result renderers
  const explorerActionProps = {
    onRename: handleRename,
    onMove: handleMove,
    onDelete: handleDelete,
    onProperties: handleProperties,
    onDoubleClick: handleItemDoubleClick,
    onPreview: openPreview,
    onDownload: downloadFile,
  };

  // ── Render content body ───────────────────────────────────────────────────
  const renderBody = () => {
    // User is typing but debounce/threshold hasn't triggered yet — show skeleton
    // to prevent the regular file list from flashing through mid-keystroke
    const isTyping = searchQuery.trim().length > 0 && !isSearchMode;
    if (isTyping) return <LoadingSkeleton viewMode={viewMode} />;

    // Search mode: show SearchResults instead of the regular file list
    if (isSearchMode) {
      if (isSearchLoading) return <LoadingSkeleton viewMode={viewMode} />;
      return (
        <SearchResults
          query={debouncedQuery}
          results={searchResults ?? []}
          isError={isSearchError}
          viewMode={viewMode}
          {...explorerActionProps}
        />
      );
    }

    // Normal explorer mode
    if (isLoading) return <LoadingSkeleton viewMode={viewMode} />;
    if (isError)   return <ErrorState message={errorMessage} onRetry={refetch} />;
    if (files.length === 0) return (
      <EmptyState 
        onNewFolder={() => setCreateFolderOpen(true)} 
        currentFolderId={currentFolderId} 
      />
    );

    return viewMode === 'grid' ? (
      <ExplorerGrid items={files} {...explorerActionProps} />
    ) : (
      <ExplorerTable items={files} {...explorerActionProps} />
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950">
      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewFolder={() => setCreateFolderOpen(true)}
        currentFolderId={currentFolderId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        isSearching={isSearchFetching && isSearchMode}
      />

      {/* Hide breadcrumbs in search mode — they're meaningless for global results */}
      {!isSearchMode && (
        <BreadcrumbNav items={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
      )}

      <UploadDropzone currentFolderId={currentFolderId}>
        <div className="flex-1 overflow-y-auto">
          {renderBody()}
        </div>
      </UploadDropzone>

      <UploadQueue />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        currentFolderId={currentFolderId}
      />

      <RenameDialog
        open={renameState.open}
        onOpenChange={(open) => setRenameState((s) => ({ ...s, open }))}
        item={renameState.item}
        currentFolderId={currentFolderId}
      />

      <MoveDialog
        open={moveState.open}
        onOpenChange={(open) => setMoveState((s) => ({ ...s, open }))}
        item={moveState.item}
        currentFolderId={currentFolderId}
      />

      <DeleteDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
        item={deleteState.item}
        currentFolderId={currentFolderId}
      />

      <PropertiesDialog
        open={propertiesState.open}
        onOpenChange={(open) => setPropertiesState((s) => ({ ...s, open }))}
        item={propertiesState.item}
      />

      <PreviewDialog
        open={previewOpen}
        onOpenChange={(open) => { if (!open) closePreview(); }}
        item={previewItem}
        previewUrl={previewUrl}
        isLoading={previewLoading}
        isError={previewError}
      />
    </div>
  );
}
