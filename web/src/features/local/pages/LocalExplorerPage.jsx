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
import { Monitor, FolderPlus, LayoutGrid, List, RefreshCw, ClipboardPaste, UploadCloud, FileText, Folder, HardDrive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/features/explorer/components/BreadcrumbNav';
import { LoadingSkeleton } from '@/features/explorer/components/LoadingSkeleton';
import { ErrorState } from '@/features/explorer/components/ErrorState';
import { useSort } from '@/features/explorer/hooks/useSort';
import { SortDropdown } from '@/features/explorer/components/SortDropdown';
import { sortFiles } from '@/utils/sortUtils';
import { UploadQueue } from '@/features/upload/components/UploadQueue';
import { useTransfers } from '@/features/upload/hooks/useTransfers';
import { SearchBar } from '@/features/search/components/SearchBar';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalDirectory } from '../hooks/useLocalDirectory';
import { useLocalClipboard } from '../hooks/useLocalClipboard';
import { useLocalSearch } from '../hooks/useLocalSearch';
import { mimeFromPath } from '../utils/mimeFromPath';
import { formatBytes } from '@/features/explorer/components/ExplorerItem';
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
      <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm border border-white/20 dark:border-white/10">
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FolderPlus className="w-10 h-10 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
          This folder is empty
        </h3>
        <p className="text-sm text-surface-600 dark:text-surface-400 max-w-sm mb-6">
          Create a new folder or upload files here.
        </p>
        <Button variant="outline" onClick={onNewFolder} className="text-surface-900 dark:text-white dark:hover:text-white dark:border-white/20 dark:hover:bg-white/10">
          New Folder
        </Button>
      </div>
    </div>
  );
}

// ── Search empty state ─────────────────────────────────────────────────────
function LocalSearchEmptyState({ query }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
      <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm border border-white/20 dark:border-white/10">
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <FileText className="w-10 h-10 text-surface-500 dark:text-surface-400" />
        </div>
        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
          No results for "{query}"
        </h3>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Try a different search term or navigate to a different folder.
        </p>
      </div>
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

  const [viewMode, setViewModeState] = useState(() => {
    return localStorage.getItem('fileex-local-view-mode') || 'grid';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem('fileex-local-view-mode', mode);
  };

  const { sortBy, direction, setSort } = useSort();

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
      
      const sortedSearch = sortFiles(searchResults, sortBy, direction);
      return viewMode === 'grid'
        ? <LocalExplorerGrid  items={sortedSearch} {...itemActionProps} />
        : <LocalExplorerTable items={sortedSearch} {...itemActionProps} sortBy={sortBy} sortDirection={direction} onSortChange={setSort} />;
    }

    if (loading) return <LoadingSkeleton viewMode={viewMode} />;
    if (error)   return <ErrorState message={error} onRetry={refresh} />;
    if (entries.length === 0) return <LocalEmptyState onNewFolder={() => setCreateFolderOpen(true)} />;
    
    const sortedEntries = sortFiles(entries, sortBy, direction);
    return viewMode === 'grid'
      ? <LocalExplorerGrid  items={sortedEntries} {...itemActionProps} />
      : <LocalExplorerTable items={sortedEntries} {...itemActionProps} sortBy={sortBy} sortDirection={direction} onSortChange={setSort} />;
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  if (!isElectron) return <NotElectronGuard />;

  return (
    // Page-level ContextMenu handles background right-click only.
    // Item right-clicks are handled inline inside LocalExplorerItem / LocalExplorerTableRow.
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={pageRef}
          tabIndex={-1}
          className="flex flex-col h-full w-full glass-workspace outline-none relative"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
          onDragEnter={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current += 1;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
              setIsDragOver(true);
            }
          }}
          onDragOver={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current -= 1;
            if (dragCounter.current === 0) {
              setIsDragOver(false);
            }
          }}
          onDrop={(e) => {
            if (!currentPath) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsDragOver(false);
            handleDropPage(e);
          }}
        >
          {/* Drag Overlay — Earth accent (incoming Cloud→Local download) */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 pointer-events-none border-2 border-dashed border-[#587463] m-2 rounded-lg bg-[#587463]/5 dark:bg-[#587463]/10 transition-all duration-200">
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#587463] text-white px-6 py-3 rounded-full shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
                <UploadCloud className="w-5 h-5" />
                <span className="font-medium text-sm">Drop to download to current folder</span>
              </div>
            </div>
          )}

          {/* Workspace identity header */}
          <div className="glass-identity flex items-center gap-3 px-5 py-3 shrink-0">
            <Monitor className="w-5 h-5 text-[#587463] dark:text-[#587463] shrink-0" />
            <div>
              <h1 className="text-sm font-semibold text-[#587463] dark:text-[#587463] leading-tight">Local (Earth)</h1>
              <p className="text-[11px] text-foreground/80 dark:text-white/80 leading-tight">Browse and manage files on your local device</p>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="glass-toolbar flex items-center justify-between gap-3 py-2 px-4 shrink-0">
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
                    className="bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 max-w-[200px]"
                    title={selectedItem ? `Upload "${selectedItem.displayName}" to Cloud` : 'Select a file first'}
                  >
                    <UploadCloud className="w-4 h-4 mr-1.5 shrink-0" />
                    <span className="truncate block">
                      {selectedItem && selectedItem.type !== 'FOLDER'
                        ? `Upload "${selectedItem.displayName}"`
                        : 'Upload to Cloud'}
                    </span>
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
                  isLoading={isSearchMode && isSearchLoading}
                />
              )}
              {currentPath && (
                <div className="flex items-center border border-surface-300 dark:border-surface-700 rounded-md p-0.5 ml-1">
                  <SortDropdown sortBy={sortBy} direction={direction} onChange={setSort} />
                  <div className="w-[1px] h-4 bg-surface-300 dark:bg-surface-700 mx-1" />
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
            <div className="glass-search-indicator px-6 py-2 text-sm text-surface-500 dark:text-surface-400">
              Searching for <span className="font-semibold text-surface-900 dark:text-surface-100">"{debouncedQuery}"</span> in current folder…
            </div>
          )}

          {/* ── Content ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-[minmax(0,1fr)_20rem] flex-1 overflow-hidden min-h-0">
            {/* Main file area */}
            <div className="overflow-y-auto" onClick={(e) => {
              // Click on background clears selection
              if (e.target === e.currentTarget) setSelectedItem(null);
            }}>
              {renderBody()}
            </div>

            {/* Inline details panel column — ALWAYS present so grid width doesn't change */}
            <div className="overflow-y-auto border-l border-black/10 dark:border-white/10">
              {selectedItem ? (
                <div className="p-3 flex flex-col gap-3">
                  <div className="glass-card rounded-lg p-3 flex flex-col gap-3">
                    <div className="flex flex-col items-center gap-2 pt-1">
                    {/* Big icon */}
                    {selectedItem.type === 'FOLDER'
                      ? <Folder className="w-10 h-10" style={{ color: '#587463' }} />
                      : <File className="w-10 h-10" style={{ color: '#587463' }} />
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
                      <dd className="text-foreground/80 dark:text-white/80 mt-0.5">{selectedItem._local?.updatedAt ? new Date(selectedItem._local.updatedAt).toLocaleDateString() : '—'}</dd>
                    </div>
                    {selectedItem.type !== 'FOLDER' && (
                      <div>
                        <dt className="text-foreground/50 dark:text-white/50 uppercase tracking-wide text-[10px]">Size</dt>
                        <dd className="text-foreground/80 dark:text-white/80 mt-0.5">{selectedItem._local?.size ? formatBytes(selectedItem._local.size) : '—'}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              ) : (
                <div className="p-3 flex flex-col gap-3 h-full pt-12">
                  <div className="glass-card rounded-lg p-6 flex flex-col gap-3 items-center text-center">
                    <Folder className="w-10 h-10 text-foreground/30 dark:text-white/30" />
                    <p className="text-[11px] text-foreground/70 dark:text-white/70">Select an item to view its details</p>
                  </div>
                </div>
              )}
            </div>
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
