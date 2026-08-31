/**
 * useLocalDirectory.js — E5: Local Explorer
 *
 * Manages local filesystem navigation state and directory loading.
 * Calls window.electronAPI (never Axios / cloud APIs).
 *
 * State managed here:
 *  - currentPath    : the directory currently being displayed
 *  - entries        : array of LocalEntry objects from readDirectory()
 *  - breadcrumbs    : [{ label, path }, ...] for BreadcrumbNav
 *  - loading / error
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Local entry adapter
// ---------------------------------------------------------------------------
// The cloud Explorer expects items shaped like:
//   { id, displayName, type: 'FOLDER'|'FILE', updatedAt, size }
//
// The filesystem API returns:
//   { name, path, type: 'folder'|'file'|'symlink', size, modifiedAt }
//
// adaptEntry() converts the local shape to the format that ExplorerGrid /
// ExplorerTable / ExplorerItem expect, without modifying those shared components.
// The original filesystem fields are preserved under a `_local` key so that
// local-specific dialogs can still access `path` etc.

export function adaptEntry(fsEntry) {
  const isFolder = fsEntry.type === 'folder' || fsEntry.type === 'symlink';
  return {
    // Fields expected by shared Explorer components
    id:          fsEntry.path,          // path is always unique — safe as React key
    displayName: fsEntry.name,
    type:        isFolder ? 'FOLDER' : 'FILE',
    updatedAt:   fsEntry.modifiedAt,
    size:        fsEntry.size ?? 0,

    // Preserve the original local fields for local-specific operations
    _local: fsEntry,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLocalDirectory() {
  const [currentPath, setCurrentPath] = useState(null);   // null = "This PC" root
  const [entries, setEntries]         = useState([]);
  const [drives, setDrives]           = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'This PC', path: null }]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // ── Load drives on first mount (used at "This PC" root) ──────────────────
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.listDrives().then((result) => {
      if (result.success) setDrives(result.data);
    });
  }, []);

  // ── Load a directory ─────────────────────────────────────────────────────
  const loadDirectory = useCallback(async (dirPath) => {
    if (!window.electronAPI) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.readDirectory(dirPath);
      if (result.success) {
        setEntries(result.data.map(adaptEntry));
      } else {
        setError(result.error?.message ?? 'Failed to read directory.');
        setEntries([]);
      }
    } catch (err) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Navigate into a path ─────────────────────────────────────────────────
  const navigateTo = useCallback((targetPath, label) => {
    if (targetPath === null) {
      // Back to "This PC" root
      setCurrentPath(null);
      setBreadcrumbs([{ label: 'This PC', path: null }]);
      setEntries([]);
      setError(null);
      return;
    }

    setCurrentPath(targetPath);

    setBreadcrumbs((prev) => {
      // If this path already exists in the breadcrumb trail (e.g. back-nav), slice to it.
      const existing = prev.findIndex((b) => b.path === targetPath);
      if (existing !== -1) return prev.slice(0, existing + 1);
      return [...prev, { label: label ?? targetPath, path: targetPath }];
    });

    loadDirectory(targetPath);
  }, [loadDirectory]);

  // ── Navigate via breadcrumb click ────────────────────────────────────────
  const navigateToBreadcrumb = useCallback((crumb, index) => {
    if (crumb.path === null) {
      navigateTo(null);
      return;
    }
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setCurrentPath(crumb.path);
    loadDirectory(crumb.path);
  }, [loadDirectory, navigateTo]);

  // ── Refresh current directory after mutations ────────────────────────────
  const refresh = useCallback(() => {
    if (currentPath) loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  // ── Reset to platform root (called when Local tab is clicked) ────────────
  // Fetches the OS-native default root (C:\ on Windows, / on Unix) via IPC
  // rather than hard-coding any path in React.
  const resetToRoot = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.getDefaultRoot();
      if (result.success) {
        const { path: rootPath, label } = result.data;
        setCurrentPath(rootPath);
        setBreadcrumbs([
          { label: 'This PC', path: null },
          { label, path: rootPath },
        ]);
        setError(null);
        loadDirectory(rootPath);
      }
    } catch (err) {
      console.error('[useLocalDirectory] resetToRoot failed:', err);
    }
  }, [loadDirectory]);

  return {
    currentPath,
    entries,
    drives,
    breadcrumbs,
    loading,
    error,
    navigateTo,
    navigateToBreadcrumb,
    refresh,
    resetToRoot,
  };
}
