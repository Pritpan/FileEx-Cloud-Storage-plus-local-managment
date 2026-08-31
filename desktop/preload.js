/**
 * preload.js — E5: Local Explorer
 * (builds on E4: Local Filesystem API, E3: Native Dialogs, E2: Secure IPC Foundation)
 *
 * This script runs in a privileged Node.js context, but contextIsolation: true
 * keeps it completely separate from the renderer's window.
 *
 * The ONLY way the renderer (React) can talk to the Main Process is through
 * the narrow, explicitly typed API surfaced here by contextBridge.
 *
 * Security rules enforced here:
 *  - ipcRenderer is NEVER exposed to the renderer.
 *  - No Node.js modules (fs, path, os, …) are forwarded.
 *  - Only named, purpose-built wrapper functions are exposed.
 *  - IPC channel strings are kept inside preload — the renderer never sees them.
 *  - dialog is not exposed; the renderer only receives clean result objects.
 *  - There is no generic "invoke any channel" escape hatch.
 *
 * Channels exposed:
 *   E2: getAppInfo()          → "app:get-info"
 *   E3: selectFile()          → "dialog:select-file"
 *   E3: selectFolder()        → "dialog:select-folder"
 *   E3: saveFile()            → "dialog:save-file"
 *   E4: readDirectory(p)      → "filesystem:read-directory"
 *   E4: getFileMetadata(p)    → "filesystem:get-metadata"
 *   E4: createDirectory(p)    → "filesystem:create-directory"
 *   E4: rename(old, new)      → "filesystem:rename"
 *   E4: delete(p)             → "filesystem:delete"
 *   E4: copy(src, dest)       → "filesystem:copy"
 *   E4: move(src, dest)       → "filesystem:move"
 *   E5: listDrives()          → "filesystem:list-drives"
 *   E5: getHomePath()         → "filesystem:get-home"
 *   E6.3: getDefaultRoot()    → "filesystem:get-default-root"
 *   E6.3: searchFiles(p,q)    → "filesystem:search"
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // -------------------------------------------------------------------------
  // E2 — App info
  // -------------------------------------------------------------------------

  /**
   * getAppInfo()
   * Returns a Promise → { name: string, platform: string }
   */
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  // -------------------------------------------------------------------------
  // E3 — Native OS dialogs
  // -------------------------------------------------------------------------

  /**
   * selectFile()
   * Opens the OS native file picker.
   * Returns a Promise → { canceled: boolean, filePath: string | null }
   */
  selectFile: () => ipcRenderer.invoke('dialog:select-file'),

  /**
   * selectFolder()
   * Opens the OS native directory picker.
   * Returns a Promise → { canceled: boolean, folderPath: string | null }
   */
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),

  /**
   * saveFile(args?)
   * Opens the OS native save-location dialog (no file is written yet).
   * Optional: { defaultFileName: string } pre-populates the filename field.
   * Returns a Promise → { canceled: boolean, filePath: string | null }
   */
  saveFile: (args) => ipcRenderer.invoke('dialog:save-file', args),

  /**
   * openPath(filePath)
   * Opens a local file or folder using the OS default application.
   * Uses Electron shell.openPath() — NOT exec/spawn/cmd/PowerShell.
   * Returns a Promise → { success: boolean, error?: { message } }
   */
  openPath: (filePath) => ipcRenderer.invoke('shell:open-path', filePath),

  // -------------------------------------------------------------------------
  // E4 — Local Filesystem API
  // All operations return { success, data } or { success, error: { code, message } }
  // -------------------------------------------------------------------------

  /**
   * readDirectory(dirPath)
   * Lists immediate children of a directory.
   * Returns a Promise → { success, data: Array<{ name, path, type, size, modifiedAt }> }
   */
  readDirectory: (dirPath) => ipcRenderer.invoke('filesystem:read-directory', dirPath),

  /**
   * getFileMetadata(filePath)
   * Returns metadata for a file or directory.
   * Returns a Promise → { success, data: { name, path, type, size, createdAt, modifiedAt } }
   */
  getFileMetadata: (filePath) => ipcRenderer.invoke('filesystem:get-metadata', filePath),

  /**
   * createDirectory(dirPath)
   * Creates a directory (and any missing parent directories).
   * Returns a Promise → { success, data: { path } }
   */
  createDirectory: (dirPath) => ipcRenderer.invoke('filesystem:create-directory', dirPath),

  /**
   * createIn(parentPath, name)
   * Creates a folder named `name` inside `parentPath`.
   * Main builds the full path using path.join — React sends no path strings.
   * Returns a Promise → { success, data: { path } }
   */
  createIn: (parentPath, name) =>
    ipcRenderer.invoke('filesystem:create-in', parentPath, name),


  /**
   * rename(oldPath, newPath)
   * Renames a file or directory.
   * Returns a Promise → { success, data: { oldPath, newPath } }
   */
  rename: (oldPath, newPath) => ipcRenderer.invoke('filesystem:rename', oldPath, newPath),


  /**
   * renameInPlace(oldPath, newName)
   * Renames a file/directory by providing just the new name (not a full path).
   * Main builds the new path safely using path.dirname + path.join.
   * Returns a Promise → { success, data: { oldPath, newPath } }
   */
  renameInPlace: (oldPath, newName) =>
    ipcRenderer.invoke('filesystem:rename-in-place', oldPath, newName),

  /**
   * delete(targetPath)
   * Permanently deletes a file or directory tree.
   * Returns a Promise → { success, data: { path } }
   */
  delete: (targetPath) => ipcRenderer.invoke('filesystem:delete', targetPath),

  /**
   * copy(sourcePath, destinationPath)
   * Copies a file or directory tree.
   * Returns a Promise → { success, data: { sourcePath, destinationPath } }
   */
  copy: (sourcePath, destinationPath) =>
    ipcRenderer.invoke('filesystem:copy', sourcePath, destinationPath),

  /**
   * move(sourcePath, destinationPath)
   * Moves a file or directory (with cross-device fallback).
   * Returns a Promise → { success, data: { sourcePath, destinationPath } }
   */
  move: (sourcePath, destinationPath) =>
    ipcRenderer.invoke('filesystem:move', sourcePath, destinationPath),

  // -------------------------------------------------------------------------
  // E5 — Local Explorer: Drive discovery & home directory
  // -------------------------------------------------------------------------

  /**
   * listDrives()
   * Returns available filesystem roots (drives on Windows, /Volumes on macOS).
   * Returns a Promise → { success, data: Array<{ label, path }> }
   */
  listDrives: () => ipcRenderer.invoke('filesystem:list-drives'),

  /**
   * getHomePath()
   * Returns the current user's home directory.
   * Returns a Promise → { success, data: { path } }
   */
  getHomePath: () => ipcRenderer.invoke('filesystem:get-home'),

  /**
   * getDefaultRoot()
   * Returns the platform default filesystem root (C:\ on Windows, / on Unix).
   * Used by the Local tab to always reset navigation to the drive root.
   * Returns a Promise → { success, data: { path, label } }
   */
  getDefaultRoot: () => ipcRenderer.invoke('filesystem:get-default-root'),

  /**
   * searchFiles(dirPath, query)
   * Recursively searches `dirPath` for files/folders whose name contains `query`.
   * Traversal is done entirely in the Main Process — no fs exposure to renderer.
   * Returns a Promise → { success, data: Array<{ name, path, type, size, modifiedAt }> }
   */
  searchFiles: (dirPath, query) => ipcRenderer.invoke('filesystem:search', dirPath, query),

  // -------------------------------------------------------------------------
  // E6 — Local ↔ Cloud Transfers
  // -------------------------------------------------------------------------

  /**
   * uploadLocalFile({ transferId, localPath, presignedUrl, mimeType, fileSize })
   * Streams a local file directly to a presigned S3 PUT URL in the Main Process.
   * No file data passes through IPC or renderer memory.
   * Returns a Promise → { success } | { success: false, error: { code, message } }
   */
  uploadLocalFile: (args) => ipcRenderer.invoke('transfer:upload-local-file', args),

  /**
   * downloadToLocal({ transferId, presignedUrl, destinationPath })
   * Streams from a presigned S3 GET URL directly to a local file.
   * Returns a Promise → { success } | { success: false, error: { code, message } }
   */
  downloadToLocal: (args) => ipcRenderer.invoke('transfer:download-to-local', args),

  /**
   * onTransferProgress(callback)
   * Subscribes to transfer:progress events pushed from the Main Process.
   * callback({ transferId, percent, bytesTransferred, totalBytes })
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  onTransferProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('transfer:progress', handler);
    return () => ipcRenderer.removeListener('transfer:progress', handler);
  },
});


