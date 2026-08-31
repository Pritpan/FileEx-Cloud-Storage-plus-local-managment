import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Cloud } from 'lucide-react';
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
import { EnvironmentBanner } from '@/components/environment/EnvironmentBanner';

export function ExplorerPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState('list');
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
      return <SearchResults query={debouncedQuery} results={searchResults ?? []} isError={isSearchError} viewMode={viewMode} {...explorerActionProps} />;
    }
    if (isLoading) return <LoadingSkeleton viewMode={viewMode} />;
    if (isError) return <ErrorState message={errorMessage} onRetry={refetch} />;
    if (files.length === 0) return <EmptyState onNewFolder={() => setCreateFolderOpen(true)} currentFolderId={currentFolderId} />;
    return viewMode === 'grid'
      ? <ExplorerGrid items={files} {...explorerActionProps} />
      : <ExplorerTable items={files} {...explorerActionProps} />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950">
      {/* Workspace identity header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shrink-0">
        <Cloud className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
        <h1 className="text-base font-semibold text-brand-600 dark:text-brand-400 tracking-tight">Cloud (Sky)</h1>
      </div>

      {/* Environment banner */}
      <EnvironmentBanner environment="cloud" />

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
      />

      {/* Breadcrumbs */}
      {!isSearchMode && (
        <BreadcrumbNav items={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
      )}

      {/* File workspace */}
      <UploadDropzone currentFolderId={currentFolderId}>
        <div className="flex-1 overflow-y-auto" onClick={() => setSelectedItem(null)}>
          {renderBody()}
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
