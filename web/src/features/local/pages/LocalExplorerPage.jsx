/**
 * LocalExplorerPage.jsx — E5/E6 Local Explorer (fully revised)
 *
 * Interaction model:
 *   Single click  → select item (visual highlight)
 *   Double click  → open (navigate folder / OS-open file via shell.openPath)
 *   Right click   → context menu (Open, Upload to Cloud, Copy, Cut,
 *                   Rename, Delete, Properties)
 *
 * Upload to Cloud:
 *   Uses the selected item's _local.path directly.
 *   Does NOT re-open a file picker.
 *   Calls E6 uploadLocalToCloud(path, name, mime, size, cloudFolderId).
 *
 * Cloud destination for uploads:
 *   currentCloudFolderId prop — the cloud folder currently open in the
 *   Cloud Explorer pane. When no cloud folder is selected this is null
 *   which means the cloud root ("My Files"). This is the simplest UX
 *   that avoids a separate folder-picker dialog.
 *
 * Copy / Cut / Paste:
 *   Application-level clipboard (useLocalClipboard).
 *   NOT the OS clipboard. State is session-only.
 *
 * Empty-area context menu:
 *   Right-click on the page background:
 *     New Folder | Paste | Refresh
 *
 * Keyboard shortcuts:
 *   Enter  → open selected item
 *   F2     → rename selected item
 *   Delete → delete selected item
 *   Ctrl+C → copy selected item
 *   Ctrl+X → cut selected item
 *   Ctrl+V → paste
 *
 * Security:
 *   All local-native operations go through window.electronAPI.
 *   No fs, shell, ipcRenderer, or Node APIs in React.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderPlus, LayoutGrid, List, RefreshCw, ClipboardPaste, UploadCloud } from 'lucide-react';
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
import { useLocalDirectory } from '../hooks/useLocalDirectory';
import { useLocalClipboard } from '../hooks/useLocalClipboard';
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

// ── Empty folder state ───────────────────────────────────────────────────
function LocalEmptyState({ onNewFolder }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
        <FolderPlus className="w-10 h-10 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
        This folder is empty
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        Create a new folder or upload files here.
      </p>
      <Button variant="outline" onClick={onNewFolder}>
        New Folder
      </Button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
/**
 * @param {{ currentCloudFolderId?: number|null }} props
 *   currentCloudFolderId — cloud folder ID for the "Upload to Cloud" destination.
 *   Null → cloud root. Set by the parent layout/router from ExplorerStore.
 */
export function LocalExplorerPage({ currentCloudFolderId = null }) {
  const pageRef = useRef(null);

  // ── View ──────────────────────────────────────────────────────────────────
  // Guard — detect Electron environment BEFORE hooks are conditionally called.
  // We call all hooks unconditionally, then return early from render.
  // This satisfies React's Rules of Hooks (hooks called in the same order every render).
  const isElectron = Boolean(window.electronAPI);

  const [viewMode, setViewMode] = useState('grid');

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Dialogs ───────────────────────────────────────────────────────────────
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameState,      setRenameState]      = useState({ open: false, item: null });
  const [deleteState,      setDeleteState]      = useState({ open: false, item: null });
  const [propertiesState,  setPropertiesState]  = useState({ open: false, item: null });

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { uploadLocalToCloud, downloadCloudToLocal } = useTransfers();
  const { clipboard, copy, cut, paste, hasPaste } = useLocalClipboard();

  const {
    currentPath, entries, drives, breadcrumbs,
    loading, error, navigateTo, navigateToBreadcrumb, refresh,
  } = useLocalDirectory();

  // ── Clear selection when navigating ──────────────────────────────────────
  useEffect(() => {
    setSelectedItem(null);
  }, [currentPath]);


  // ── Open (double-click) ───────────────────────────────────────────────────
  const handleOpen = useCallback(async (item) => {
    if (item.type === 'FOLDER') {
      navigateTo(item._local.path, item.displayName);
      return;
    }
    // File: open with OS default application
    const result = await window.electronAPI.openPath(item._local.path);
    if (!result.success) {
      toast.error(`Could not open "${item.displayName}": ${result.error?.message ?? 'Unknown error'}`);
    }
  }, [navigateTo]);

  // ── Select (single click) ─────────────────────────────────────────────────
  const handleSelect = useCallback((item) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }, []);

  // ── Upload to Cloud (uses already-selected item, NO file picker) ──────────
  const handleUploadToCloud = useCallback(async (item) => {
    if (!item || item.type === 'FOLDER') {
      toast.warning('Folder upload is not yet supported. Select individual files.');
      return;
    }
    const { path: localPath, name: fileName, size: fileSize } = item._local;
    const mimeType = mimeFromPath(fileName);
    await uploadLocalToCloud(localPath, fileName, mimeType, fileSize, currentCloudFolderId);
  }, [uploadLocalToCloud, currentCloudFolderId]);

  // ── Toolbar "Upload" button: requires a selected file ────────────────────
  const handleToolbarUpload = useCallback(async () => {
    if (!selectedItem) {
      toast.info('Select a file first, then click Upload to Cloud.');
      return;
    }
    await handleUploadToCloud(selectedItem);
  }, [selectedItem, handleUploadToCloud]);

  // ── Cross-Pane Drag & Drop (Cloud → Local) ───────────────────────────────
  const handleCloudToLocalDrop = useCallback(async (dataStr, targetDirPath) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.type !== 'CLOUD_FILE') return;
      // Synthesize a cloud item object that downloadCloudToLocal expects
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


  // ── Rename ─────────────────────────────────────────────────────────────────
  const handleRename = useCallback((item) => {
    setRenameState({ open: true, item });
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((item) => {
    setDeleteState({ open: true, item });
  }, []);

  // ── Properties ────────────────────────────────────────────────────────────
  const handleProperties = useCallback((item) => {
    setPropertiesState({ open: true, item });
  }, []);

  // ── Paste (background click) ───────────────────────────────────────────────
  const handlePaste = useCallback(() => {
    if (currentPath) paste(currentPath, refresh);
  }, [paste, currentPath, refresh]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const onKey = (e) => {
      // Don't steal shortcuts when a dialog/input is focused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (document.querySelector('[data-state="open"][role="dialog"]')) return;

      const sel = selectedItem;

      if (e.key === 'Enter' && sel) {
        e.preventDefault();
        handleOpen(sel);
      } else if (e.key === 'F2' && sel) {
        e.preventDefault();
        handleRename(sel);
      } else if (e.key === 'Delete' && sel) {
        e.preventDefault();
        handleDelete(sel);
      } else if (e.ctrlKey && e.key === 'c' && sel) {
        e.preventDefault();
        copy(sel);
      } else if (e.ctrlKey && e.key === 'x' && sel) {
        e.preventDefault();
        cut(sel);
      } else if (e.ctrlKey && e.key === 'v' && currentPath) {
        e.preventDefault();
        handlePaste();
      }
    };

    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [selectedItem, currentPath, handleOpen, handleRename, handleDelete, copy, cut, handlePaste]);

  // ── Shared action props for both grid and table ───────────────────────────
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

  // ── Content body ──────────────────────────────────────────────────────────
  const renderBody = () => {
    if (currentPath === null) {
      return <DriveList drives={drives} onSelect={navigateTo} />;
    }
    if (loading) return <LoadingSkeleton viewMode={viewMode} />;
    if (error)   return <ErrorState message={error} onRetry={refresh} />;
    if (entries.length === 0) {
      return <LocalEmptyState onNewFolder={() => setCreateFolderOpen(true)} />;
    }
    return viewMode === 'grid'
      ? <LocalExplorerGrid  items={entries} {...itemActionProps} />
      : <LocalExplorerTable items={entries} {...itemActionProps} />;
  };

  const [isDragOver, setIsDragOver] = useState(false);

  // ── Render ────────────────────────────────────────────────────────────────
  // Guard here — after all hooks — so React Rules of Hooks are satisfied
  if (!isElectron) return <NotElectronGuard />;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {/* tabIndex makes the div keyboard-focusable for shortcut listeners */}
        <div
          ref={pageRef}
          tabIndex={-1}
          className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950 outline-none relative"
          onClick={() => setSelectedItem(null)} // click on empty space deselects
          onDragOver={(e) => {
            if (!currentPath) return; // Prevent drop on drive list
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
          {/* Drag Overlay for Page */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-50/90 dark:bg-brand-950/90 backdrop-blur-sm border-2 border-dashed border-brand-500 m-2 rounded-xl pointer-events-none">
              <div className="bg-surface-0 dark:bg-surface-900 p-6 rounded-full shadow-lg mb-4">
                <UploadCloud className="w-12 h-12 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-100">Drop to Download</h3>
              <p className="text-brand-700 dark:text-brand-300 mt-2">File will be downloaded to the current local folder</p>
            </div>
          )}

          {/* ── Toolbar ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950">
            <div className="flex items-center gap-2">
              {currentPath && (
                <>
                  <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setCreateFolderOpen(true); }}
                    className="text-surface-900 dark:text-surface-100 dark:hover:text-white"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>

                  <Button
                    variant="default"
                    onClick={(e) => { e.stopPropagation(); handleToolbarUpload(); }}
                    disabled={!selectedItem || selectedItem.type === 'FOLDER'}
                    className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    title={selectedItem ? `Upload "${selectedItem.displayName}" to cloud` : 'Select a file first'}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {selectedItem && selectedItem.type !== 'FOLDER'
                      ? `Upload "${selectedItem.displayName}"`
                      : 'Upload to Cloud'}
                  </Button>
                </>
              )}
            </div>

            {currentPath && (
              <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-md p-1 bg-surface-50 dark:bg-surface-900">
                <Button
                  variant="ghost" size="icon"
                  className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 text-surface-700 dark:text-surface-300" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4 text-surface-700 dark:text-surface-300" />
                </Button>
              </div>
            )}
          </div>

          {/* ── Breadcrumbs ─────────────────────────────────────────────────── */}
          <BreadcrumbNav items={breadcrumbs} onNavigate={navigateToBreadcrumb} />

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {renderBody()}
          </div>

          {/* ── Dialogs ─────────────────────────────────────────────────────── */}
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

          {/* Transfer progress queue */}
          <UploadQueue />
        </div>
      </ContextMenuTrigger>

      {/* ── Empty-area right-click menu ─────────────────────────────────────── */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => setCreateFolderOpen(true)}
          disabled={!currentPath}
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handlePaste}
          disabled={!hasPaste || !currentPath}
        >
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
