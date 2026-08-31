/**
 * LocalExplorerPage.jsx — E5/E6/E6.3 Local Explorer
 *
 * E6.3 additions:
 *   1. LOCAL SEARCH — SearchBar + useLocalSearch + debounce (400ms, min 2 chars)
 *      Recursive within current directory (Main Process, max depth 6, max 200 results)
 *   2. RIGHT-CLICK CONTEXT MENU — handled inline per-item in LocalExplorerItem /
 *      LocalExplorerTableRow (ContextMenu wraps each item directly)
 *   3. ROOT RESET ON TAB CLICK — calls resetToRoot() on mount via IPC
 *      getDefaultRoot() → C:\ on Windows, / on Unix (no hard-coded paths in React)
 *
 * Interaction model:
 *   Single click  → select item
 *   Double click  → open (navigate folder / OS-open file)
 *   Right click   → per-item ContextMenu (item-level) or background ContextMenu
 *
 * Security:
 *   All local-native operations go through window.electronAPI.
 *   No fs, path, shell, ipcRenderer, or Node APIs in React.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Monitor, FolderPlus, LayoutGrid, List, RefreshCw, ClipboardPaste, UploadCloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/features/explorer/components/BreadcrumbNav';
import { LoadingSkeleton } from '@/features/explorer/components/LoadingSkeleton';
import { ErrorState } from '@/features/explorer/components/ErrorState';
import { UploadQueue } from '@/features/upload/components/UploadQueue';
import { useTransfers } from '@/features/upload/hooks/useTransfers';
import { SearchBar } from '@/features/search/components/SearchBar';
import { useDebounce } from '@/hooks/useDebounce';
import { EnvironmentBanner } from '@/components/environment/EnvironmentBanner';
import { useLocalDirectory } from '../hooks/useLocalDirectory';
import { useLocalClipboard } from '../hooks/useLocalClipboard';
import { useLocalSearch } from '../hooks/useLocalSearch';
import { mimeFromPath } from '../utils/mimeFromPath';
import { DriveList } from '../components/DriveList';
import { LocalExplorerGrid } from '../components/LocalExplorerGrid';
import { LocalExplorerTable } from '../components/LocalExplorerTable';
import { LocalCreateFolderDialog } from '../components/LocalCreateFolderDialog';
import { LocalRenameDialog } from '../components/LocalRenameDialog';
import { LocalDeleteDialog } from '../components/LocalDeleteDialog';
import { LocalPropertiesDialog } from '../components/LocalPropertiesDialog';

// ── Not-in-Electron guard ─────────────────────────────────────────────────
function NotElectronGuard() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <p className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
        Local Explorer is only available in the Fileex desktop app.
      </p>
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Open this page in the Electron application to browse your local files.
      </p>
    </div>
  );
}

// ── Empty folder state ─────────────────────────────────────────────────────
function LocalEmptyState({ onNewFolder }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
        <FolderPlus className="w-10 h-10 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-medium text-surface-600 dark:text-surface-100 mb-2">
        This folder is empty
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        Create a new folder or upload files here.
      </p>
      <Button variant="outline" onClick={onNewFolder}>New Folder</Button>
    </div>
  );
}

// ── Search empty state ─────────────────────────────────────────────────────
function LocalSearchEmptyState({ query }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-medium text-surface-600 dark:text-surface-100 mb-2">
        No results for "{query}"
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm">
        Try a different search term or navigate to a different folder.
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
/**
 * @param {{ currentCloudFolderId?: number|null }} props
 */
export function LocalExplorerPage({ currentCloudFolderId = null }) {
  const pageRef = useRef(null);

  // Guard — all hooks run unconditionally; return early from render if not Electron
  const isElectron = Boolean(window.electronAPI);

  const [viewMode, setViewMode] = useState('grid');

  // ── Selection ──────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 400);
  const isSearchMode = debouncedQuery.trim().length >= 2;

  // ── Dialogs ────────────────────────────────────────────────────────────────
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameState,      setRenameState]      = useState({ open: false, item: null });
  const [deleteState,      setDeleteState]      = useState({ open: false, item: null });
  const [propertiesState,  setPropertiesState]  = useState({ open: false, item: null });

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { uploadLocalToCloud, downloadCloudToLocal } = useTransfers();
  const { clipboard, copy, cut, paste, hasPaste } = useLocalClipboard();

  const {
    currentPath, entries, drives, breadcrumbs,
    loading, error, navigateTo, navigateToBreadcrumb, refresh, resetToRoot,
  } = useLocalDirectory();

  // ── Local search ───────────────────────────────────────────────────────────
  const {
    results: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useLocalSearch(currentPath, debouncedQuery);

  // ── Root reset on mount ────────────────────────────────────────────────────
  // Every time the user navigates to /local (this component mounts), reset
  // to the platform root via IPC getDefaultRoot() — no hard-coded C:\ in React.
  useEffect(() => {
    if (isElectron) {
      resetToRoot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: run only on first mount per navigation

  // ── Clear selection and search when navigating ─────────────────────────────
  useEffect(() => {
    setSelectedItem(null);
    setSearchQuery('');
  }, [currentPath]);

  // ── Open (double-click) ────────────────────────────────────────────────────
  const handleOpen = useCallback(async (item) => {
    if (item.type === 'FOLDER') {
      navigateTo(item._local.path, item.displayName);
      return;
    }
    const result = await window.electronAPI.openPath(item._local.path);
    if (!result.success) {
      toast.error(`Could not open "${item.displayName}": ${result.error?.message ?? 'Unknown error'}`);
    }
  }, [navigateTo]);

  // ── Select (single click) ──────────────────────────────────────────────────
  const handleSelect = useCallback((item) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }, []);

  // ── Upload to Cloud ────────────────────────────────────────────────────────
  const handleUploadToCloud = useCallback(async (item) => {
    if (!item || item.type === 'FOLDER') {
      toast.warning('Folder upload is not yet supported. Select individual files.');
      return;
    }
    const { path: localPath, name: fileName, size: fileSize } = item._local;
    const mimeType = mimeFromPath(fileName);
    await uploadLocalToCloud(localPath, fileName, mimeType, fileSize, currentCloudFolderId);
  }, [uploadLocalToCloud, currentCloudFolderId]);

  // ── Toolbar Upload button ──────────────────────────────────────────────────
  const handleToolbarUpload = useCallback(async () => {
    if (!selectedItem) {
      toast.info('Select a file first, then click Upload to Cloud.');
      return;
    }
    await handleUploadToCloud(selectedItem);
  }, [selectedItem, handleUploadToCloud]);

  // ── Cross-Pane Drag & Drop (Cloud → Local) ─────────────────────────────────
  const handleCloudToLocalDrop = useCallback(async (dataStr, targetDirPath) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.type !== 'CLOUD_FILE') return;
      const cloudItem = { id: data.id, displayName: data.name, size: data.size, type: 'FILE' };
      await downloadCloudToLocal(cloudItem, refresh, targetDirPath);
    } catch (err) {
      console.error('Invalid drop data', err);
    }
  }, [downloadCloudToLocal, refresh]);

  const handleDropItem = useCallback((e, localFolderItem) => {
    if (localFolderItem.type !== 'FOLDER') return;
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    handleCloudToLocalDrop(dataStr, localFolderItem._local.path);
  }, [handleCloudToLocalDrop]);

  const handleDropPage = useCallback((e) => {
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr || !currentPath) return;
    handleCloudToLocalDrop(dataStr, currentPath);
  }, [handleCloudToLocalDrop, currentPath]);

  // ── Rename / Delete / Properties ───────────────────────────────────────────
  const handleRename = useCallback((item) => setRenameState({ open: true, item }), []);
  const handleDelete = useCallback((item) => setDeleteState({ open: true, item }), []);
  const handleProperties = useCallback((item) => setPropertiesState({ open: true, item }), []);

  // ── Paste ──────────────────────────────────────────────────────────────────
  const handlePaste = useCallback(() => {
    if (currentPath) paste(currentPath, refresh);
  }, [paste, currentPath, refresh]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (document.querySelector('[data-state="open"][role="dialog"]')) return;

      const sel = selectedItem;
      if (e.key === 'Enter' && sel)           { e.preventDefault(); handleOpen(sel); }
      else if (e.key === 'F2' && sel)         { e.preventDefault(); handleRename(sel); }
      else if (e.key === 'Delete' && sel)     { e.preventDefault(); handleDelete(sel); }
      else if (e.ctrlKey && e.key === 'c' && sel) { e.preventDefault(); copy(sel); }
      else if (e.ctrlKey && e.key === 'x' && sel) { e.preventDefault(); cut(sel); }
      else if (e.ctrlKey && e.key === 'v' && currentPath) { e.preventDefault(); handlePaste(); }
    };

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [selectedItem, currentPath, handleOpen, handleRename, handleDelete, copy, cut, handlePaste]);

  // ── Shared action props for grid and table ─────────────────────────────────
  const itemActionProps = {
    selectedId:      selectedItem?.id ?? null,
    onSelect:        handleSelect,
    onOpen:          handleOpen,
    onUploadToCloud: handleUploadToCloud,
    onCopy:          copy,
    onCut:           cut,
    onRename:        handleRename,
    onDelete:        handleDelete,
    onProperties:    handleProperties,
    onDropItem:      handleDropItem,
  };

  // ── Content body ───────────────────────────────────────────────────────────
  const renderBody = () => {
    if (currentPath === null) {
      return <DriveList drives={drives} onSelect={navigateTo} />;
    }

    if (isSearchMode) {
      if (isSearchLoading) return <LoadingSkeleton viewMode={viewMode} />;
      if (isSearchError)   return <ErrorState message="Search failed. Try again." onRetry={() => {}} />;
      if (searchResults.length === 0) return <LocalSearchEmptyState query={debouncedQuery} />;
      return viewMode === 'grid'
        ? <LocalExplorerGrid  items={searchResults} {...itemActionProps} />
        : <LocalExplorerTable items={searchResults} {...itemActionProps} />;
    }

    if (loading) return <LoadingSkeleton viewMode={viewMode} />;
    if (error)   return <ErrorState message={error} onRetry={refresh} />;
    if (entries.length === 0) return <LocalEmptyState onNewFolder={() => setCreateFolderOpen(true)} />;
    return viewMode === 'grid'
      ? <LocalExplorerGrid  items={entries} {...itemActionProps} />
      : <LocalExplorerTable items={entries} {...itemActionProps} />;
  };

  const [isDragOver, setIsDragOver] = useState(false);

  if (!isElectron) return <NotElectronGuard />;

  return (
    // Page-level ContextMenu handles background right-click only.
    // Item right-clicks are handled inline inside LocalExplorerItem / LocalExplorerTableRow.
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={pageRef}
          tabIndex={-1}
          className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950 outline-none relative"
          onClick={() => setSelectedItem(null)}
          onDragOver={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            handleDropPage(e);
          }}
        >
          {/* Drag Overlay — Earth accent (incoming Cloud→Local download) */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-earth-50/95 dark:bg-earth-900/90 backdrop-blur-sm border-2 border-dashed border-earth-600 m-2 rounded-lg pointer-events-none">
              <div className="bg-surface-0 dark:bg-surface-800 p-5 rounded-full shadow-sm mb-4">
                <UploadCloud className="w-10 h-10 text-earth-600" />
              </div>
              <h3 className="text-lg font-semibold text-earth-600 dark:text-earth-400">Drop to Download</h3>
              <p className="text-earth-600/70 dark:text-earth-400/70 mt-1 text-sm">File will be saved to the current local folder</p>
            </div>
          )}

          {/* Workspace identity header */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shrink-0">
            <Monitor className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            <h1 className="text-base font-semibold text-brand-600 dark:text-brand-400 tracking-tight">Local (Earth)</h1>
          </div>

          {/* Earth environment banner */}
          <EnvironmentBanner environment="local" />

          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between gap-3 py-2 px-4 border-b border-surface-300 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shrink-0">
            <div className="flex items-center gap-2">
              {currentPath && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setCreateFolderOpen(true); }}
                  >
                    <FolderPlus className="w-4 h-4 mr-1.5" />
                    New Folder
                  </Button>
                  {/* Upload to Cloud — Sky accent (destination = Cloud) */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleToolbarUpload(); }}
                    disabled={!selectedItem || selectedItem.type === 'FOLDER'}
                    className="bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40"
                    title={selectedItem ? `Upload "${selectedItem.displayName}" to Cloud` : 'Select a file first'}
                  >
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    {selectedItem && selectedItem.type !== 'FOLDER'
                      ? `Upload "${selectedItem.displayName}"`
                      : 'Upload to Cloud'}
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentPath && (
                <SearchBar
                  query={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  isLoading={isSearchLoading && isSearchMode}
                />
              )}
              {currentPath && (
                <div className="flex items-center border border-surface-300 dark:border-surface-700 rounded-md p-0.5">
                  <Button
                    variant="ghost" size="icon"
                    className={`h-7 w-7 rounded-sm ${
                      viewMode === 'list'
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-400'
                        : 'text-surface-500'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={`h-7 w-7 rounded-sm ${
                      viewMode === 'grid'
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-400'
                        : 'text-surface-500'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Breadcrumbs — hide in search mode ───────────────────────── */}
          {!isSearchMode && (
            <BreadcrumbNav items={breadcrumbs} onNavigate={navigateToBreadcrumb} />
          )}

          {/* ── Search mode indicator ─────────────────────────────────────── */}
          {isSearchMode && currentPath && (
            <div className="px-6 py-2 text-sm text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950">
              Searching for <span className="font-semibold text-surface-900 dark:text-surface-100">"{debouncedQuery}"</span> in current folder…
            </div>
          )}

          {/* ── Content ──────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {renderBody()}
          </div>

          {/* ── Dialogs ──────────────────────────────────────────────────── */}
          <LocalCreateFolderDialog
            open={createFolderOpen}
            onOpenChange={setCreateFolderOpen}
            currentPath={currentPath}
            onSuccess={refresh}
          />
          <LocalRenameDialog
            open={renameState.open}
            onOpenChange={(open) => setRenameState((s) => ({ ...s, open }))}
            item={renameState.item}
            onSuccess={refresh}
          />
          <LocalDeleteDialog
            open={deleteState.open}
            onOpenChange={(open) => setDeleteState((s) => ({ ...s, open }))}
            item={deleteState.item}
            onSuccess={refresh}
          />
          <LocalPropertiesDialog
            open={propertiesState.open}
            onOpenChange={(open) => setPropertiesState((s) => ({ ...s, open }))}
            item={propertiesState.item}
          />
          <UploadQueue />
        </div>
      </ContextMenuTrigger>

      {/* ── Background right-click menu ──────────────────────────────────── */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => setCreateFolderOpen(true)} disabled={!currentPath}>
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste} disabled={!hasPaste || !currentPath}>
          <ClipboardPaste className="w-4 h-4 mr-2" />
          Paste {clipboard.item ? `"${clipboard.item.displayName}"` : ''}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={refresh} disabled={!currentPath}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
