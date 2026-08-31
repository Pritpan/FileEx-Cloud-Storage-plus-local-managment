import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import https from 'https';
import http from 'http';
import {
  readDirectory,
  getFileMetadata,
  createDirectory,
  rename,
  deleteEntry,
  copy,
  move,
  searchFiles,
} from './filesystem/filesystem.service.js';

// ---------------------------------------------------------------------------
// ES module equivalent of __dirname
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Dev vs Production
// In development, Vite serves the React app on localhost:5174.
// In production, Electron loads the pre-built static files from web/dist.
// ---------------------------------------------------------------------------
const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5174';
const PROD_FILE = path.join(__dirname, '..', 'web', 'dist', 'index.html');

// ---------------------------------------------------------------------------
// IPC Handlers — E2: Secure IPC Foundation
// ---------------------------------------------------------------------------

/**
 * Channel: app:get-info
 * Returns basic, non-sensitive application and runtime metadata.
 * The renderer calls this via window.electronAPI.getAppInfo().
 * Only the Main Process owns this data — the renderer cannot construct it.
 */
ipcMain.handle('app:get-info', () => ({
  name: 'Fileex',
  platform: process.platform,
}));

// ---------------------------------------------------------------------------
// IPC Handlers — E3: Native Dialogs
// ---------------------------------------------------------------------------
//
// Important: dialog must be called from the Main Process.
// The renderer (React) has no access to Electron internals.
// Each handler normalises the raw Electron result to a clean object so that
// the renderer only ever sees the fields it actually needs.

/**
 * Channel: dialog:select-file
 * Opens the OS native file-picker.
 * Returns { canceled, filePath } where filePath is a string or null.
 */
ipcMain.handle('dialog:select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  return {
    canceled,
    filePath: canceled ? null : filePaths[0],
  };
});

/**
 * Channel: dialog:select-folder
 * Opens the OS native directory-picker.
 * Returns { canceled, folderPath } where folderPath is a string or null.
 */
ipcMain.handle('dialog:select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return {
    canceled,
    folderPath: canceled ? null : filePaths[0],
  };
});

/**
 * Channel: dialog:save-file
 * Opens the OS native save dialog (path selection only — no writing yet).
 * Accepts optional { defaultFileName } to pre-populate the filename field.
 * Returns { canceled, filePath } where filePath is a string or null.
 */
ipcMain.handle('dialog:save-file', async (_event, args = {}) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: args.defaultFileName || undefined,
  });
  return {
    canceled,
    filePath: canceled ? null : filePath,
  };
});

// ---------------------------------------------------------------------------
// IPC Handlers — Local File Opening (E5/E6 refinement)
// ---------------------------------------------------------------------------

/**
 * Channel: shell:open-path
 *
 * Opens a local path using the OS default application.
 * Delegates entirely to Electron's shell.openPath() which is OS-native and
 * does NOT execute a shell command, script, or child process.
 *
 * Security:
 *   - The path is passed as a string only.
 *   - shell.openPath() will refuse to execute files that are not registered
 *     as openable applications on the OS.
 *   - No shell=true, no exec, no spawn, no cmd/PowerShell.
 *
 * Returns: { success: true } | { success: false, error: { message } }
 */
ipcMain.handle('shell:open-path', async (_event, filePath) => {
  try {
    // shell.openPath returns an empty string on success, or an error message on failure.
    const result = await shell.openPath(filePath);
    if (result === '') {
      return { success: true };
    }
    return { success: false, error: { message: result || 'OS could not open this file.' } };
  } catch (err) {
    return { success: false, error: { message: err.message } };
  }
});


// ---------------------------------------------------------------------------
// IPC Handlers — E4: Local Filesystem API
// ---------------------------------------------------------------------------
//
// Each handler delegates entirely to filesystem.service.js.
// No filesystem logic lives here — main.js stays thin.
// All operations return a consistent envelope:
//   { success: true,  data: ... }
//   { success: false, error: { code, message } }

/** filesystem:read-directory — list immediate children of a directory */
ipcMain.handle('filesystem:read-directory', (_event, dirPath) =>
  readDirectory(dirPath),
);

/** filesystem:get-metadata — stat a single file or directory */
ipcMain.handle('filesystem:get-metadata', (_event, filePath) =>
  getFileMetadata(filePath),
);

/** filesystem:create-directory — mkdir -p equivalent (full path provided) */
ipcMain.handle('filesystem:create-directory', (_event, dirPath) =>
  createDirectory(dirPath),
);

/**
 * filesystem:create-in
 * Creates a directory named `name` inside `parentPath`.
 * Path joining is done in Main using path.join — React sends no path strings.
 */
ipcMain.handle('filesystem:create-in', (_event, parentPath, name) => {
  const newPath = path.join(parentPath, name);
  return createDirectory(newPath);
});

/** filesystem:rename — rename or same-volume move */
ipcMain.handle('filesystem:rename', (_event, oldPath, newPath) =>
  rename(oldPath, newPath),
);

/** filesystem:delete — permanent delete (file or directory tree) */
ipcMain.handle('filesystem:delete', (_event, targetPath) =>
  deleteEntry(targetPath),
);

/** filesystem:copy — copy file or directory tree */
ipcMain.handle('filesystem:copy', (_event, sourcePath, destinationPath) =>
  copy(sourcePath, destinationPath),
);

/** filesystem:move — move with cross-device fallback */
ipcMain.handle('filesystem:move', (_event, sourcePath, destinationPath) =>
  move(sourcePath, destinationPath),
);

/**
 * filesystem:rename-in-place
 * Renames a file/directory using (oldPath, newName) where newName is just
 * the filename — not a full path. The new full path is composed in Main
 * using path.dirname + path.join so React never has to manipulate path strings.
 *
 * This is the preferred channel for the LocalRenameDialog.
 */
ipcMain.handle('filesystem:rename-in-place', (_event, oldPath, newName) => {
  const parentDir  = path.dirname(oldPath);
  const newPath    = path.join(parentDir, newName);
  return rename(oldPath, newPath);
});

// ---------------------------------------------------------------------------
// IPC Handlers — E5: Local Explorer
// ---------------------------------------------------------------------------

/**
 * Channel: filesystem:list-drives
 *
 * Returns available filesystem roots for the current platform.
 *
 * Windows: probes A–Z drive letters using fs.access (no shell commands).
 * macOS:   /Volumes/* subdirectories.
 * Linux:   returns the single root '/'.
 *
 * Returns: { success: true, data: Array<{ label, path }> }
 */
ipcMain.handle('filesystem:list-drives', async () => {
  try {
    if (process.platform === 'win32') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const checks = await Promise.allSettled(
        letters.map(async (l) => {
          const drivePath = `${l}:\\`;
          await fs.access(drivePath);
          return { label: `${l}:`, path: drivePath };
        }),
      );
      const drives = checks
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
      return { success: true, data: drives };
    }

    if (process.platform === 'darwin') {
      const entries = await fs.readdir('/Volumes', { withFileTypes: true });
      const vols = entries
        .filter((e) => e.isDirectory() || e.isSymbolicLink())
        .map((e) => ({ label: e.name, path: `/Volumes/${e.name}` }));
      return { success: true, data: vols };
    }

    // Linux / other POSIX — return root
    return { success: true, data: [{ label: '/', path: '/' }] };
  } catch (err) {
    console.error('[main] filesystem:list-drives error:', err.message);
    return { success: false, error: { code: 'FS_ERROR', message: err.message } };
  }
});

/**
 * Channel: filesystem:get-home
 * Returns the current user's home directory path.
 * Used by the Local Explorer as the default starting location.
 */
ipcMain.handle('filesystem:get-home', () => ({
  success: true,
  data: { path: os.homedir() },
}));

/**
 * Channel: filesystem:get-default-root
 *
 * Returns the default local root path for the current platform.
 * This is NOT the user's home directory — it is the filesystem root
 * (C:\ on Windows, / on macOS/Linux).
 *
 * The renderer uses this when the Local tab is clicked to always reset
 * to the root, not to the last visited folder.
 *
 * Returns: { success: true, data: { path, label } }
 */
ipcMain.handle('filesystem:get-default-root', async () => {
  try {
    if (process.platform === 'win32') {
      // Find the first available drive (almost always C:\)
      const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZAB'.split('');
      for (const l of letters) {
        const drivePath = `${l}:\\`;
        try {
          await fs.access(drivePath);
          return { success: true, data: { path: drivePath, label: `${l}:` } };
        } catch {
          // Not available — try next
        }
      }
      // Fallback — should never happen on a working Windows install
      return { success: true, data: { path: 'C:\\', label: 'C:' } };
    }
    // macOS / Linux: root is always '/'
    return { success: true, data: { path: '/', label: '/' } };
  } catch (err) {
    return { success: false, error: { code: 'FS_ERROR', message: err.message } };
  }
});

/**
 * Channel: filesystem:search
 *
 * Recursively searches a directory for entries matching a query string.
 * All traversal happens in the Main Process — React never sees raw fs calls.
 *
 * Args: { dirPath: string, query: string }
 * Returns: { success, data: Array<{ name, path, type, size, modifiedAt }> }
 */
ipcMain.handle('filesystem:search', (_event, dirPath, query) =>
  searchFiles(dirPath, query),
);

// ---------------------------------------------------------------------------
// IPC Handlers — E6: Local ↔ Cloud Transfers
// ---------------------------------------------------------------------------
//
// DESIGN PRINCIPLE — No large data through IPC:
//   Both upload and download are handled entirely in the Main Process using
//   Node's built-in http/https and fs streams.  Only metadata and progress
//   percentages travel through IPC; file contents never enter IPC or the
//   renderer's memory.
//
// Authentication:
//   The renderer already obtained a presigned URL from the backend using its
//   existing auth token before calling these handlers.  The Main Process
//   receives only the pre-signed URL — no credentials, no AWS keys.

/**
 * Channel: transfer:upload-local-file
 *
 * Streams a local file directly to a presigned S3 PUT URL.
 * The renderer is responsible for calling POST /files/upload/initiate first
 * to obtain the presigned URL, and POST /files/upload/complete afterwards.
 *
 * Args: { transferId, localPath, presignedUrl, mimeType, fileSize }
 * Returns: { success: true } | { success: false, error: { code, message } }
 *
 * Progress events: webContents.send('transfer:progress', { transferId, percent, bytesTransferred, totalBytes })
 */
ipcMain.handle('transfer:upload-local-file', async (event, { transferId, localPath, presignedUrl, mimeType, fileSize }) => {
  const sender = event.sender;

  const sendProgress = (bytesTransferred, total) => {
    const percent = total > 0 ? Math.round((bytesTransferred / total) * 100) : 0;
    if (!sender.isDestroyed()) {
      sender.send('transfer:progress', { transferId, percent, bytesTransferred, totalBytes: total });
    }
  };

  return new Promise((resolve) => {
    // Validate the file exists before starting
    let stat;
    try {
      stat = fsSync.statSync(localPath);
    } catch (err) {
      resolve({ success: false, error: { code: 'NOT_FOUND', message: `Local file not found: ${err.message}` } });
      return;
    }

    const totalBytes = fileSize ?? stat.size;
    const readStream = fsSync.createReadStream(localPath);
    const url = new URL(presignedUrl);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      method: 'PUT',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Length': totalBytes,
      },
    };

    const req = transport.request(options, (res) => {
      // Consume response body to free socket
      res.resume();
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          sendProgress(totalBytes, totalBytes);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: { code: 'S3_ERROR', message: `S3 responded with ${res.statusCode}` } });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[E6 upload] request error:', err.message);
      resolve({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } });
    });

    let bytesUploaded = 0;
    readStream.on('data', (chunk) => {
      bytesUploaded += chunk.length;
      sendProgress(bytesUploaded, totalBytes);
    });

    readStream.on('error', (err) => {
      console.error('[E6 upload] read stream error:', err.message);
      req.destroy();
      resolve({ success: false, error: { code: 'READ_ERROR', message: err.message } });
    });

    readStream.pipe(req);
  });
});

/**
 * Channel: transfer:download-to-local
 *
 * Streams from a presigned S3 GET URL directly to a local file path.
 * The renderer is responsible for obtaining the presigned URL from the backend
 * and choosing the destination path via the E3 save dialog before calling this.
 *
 * Args: { transferId, presignedUrl, destinationPath }
 * Returns: { success: true } | { success: false, error: { code, message } }
 *
 * Progress events: webContents.send('transfer:progress', { transferId, percent, bytesTransferred, totalBytes })
 */
ipcMain.handle('transfer:download-to-local', async (event, { transferId, presignedUrl, destinationPath }) => {
  const sender = event.sender;

  const sendProgress = (bytesTransferred, total) => {
    const percent = total > 0 ? Math.round((bytesTransferred / total) * 100) : 0;
    if (!sender.isDestroyed()) {
      sender.send('transfer:progress', { transferId, percent, bytesTransferred, totalBytes: total });
    }
  };

  return new Promise((resolve) => {
    const url = new URL(presignedUrl);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
    };

    const req = transport.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        resolve({ success: false, error: { code: 'S3_ERROR', message: `S3 responded with ${res.statusCode}` } });
        return;
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      const writeStream = fsSync.createWriteStream(destinationPath);
      let bytesDownloaded = 0;

      res.on('data', (chunk) => {
        bytesDownloaded += chunk.length;
        sendProgress(bytesDownloaded, totalBytes);
      });

      res.pipe(writeStream);

      writeStream.on('finish', () => {
        sendProgress(totalBytes, totalBytes);
        resolve({ success: true });
      });

      writeStream.on('error', (err) => {
        console.error('[E6 download] write stream error:', err.message);
        // Attempt to clean up the partial file
        fsSync.unlink(destinationPath, () => {});
        resolve({ success: false, error: { code: 'WRITE_ERROR', message: err.message } });
      });

      res.on('error', (err) => {
        console.error('[E6 download] response stream error:', err.message);
        writeStream.destroy();
        fsSync.unlink(destinationPath, () => {});
        resolve({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } });
      });
    });

    req.on('error', (err) => {
      console.error('[E6 download] request error:', err.message);
      resolve({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } });
    });

    req.end();
  });
});

// ---------------------------------------------------------------------------
// createWindow

// ---------------------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'FileEx',
    show: false, // prevent white flash — show only when ready-to-show fires
    webPreferences: {
      // Path to the preload script.
      // import.meta.url is not available in webPreferences, so we use __dirname.
      preload: path.join(__dirname, 'preload.js'),

      // Security: the renderer (React) cannot call require() or access Node APIs.
      nodeIntegration: false,

      // Security: preload runs in its own JS context, completely isolated from
      // the renderer's window object. Only what contextBridge exposes is shared.
      contextIsolation: true,

      // Disable the ability to open devtools via keyboard shortcuts in production.
      devTools: isDev,
    },
  });

  // Show the window only after it has finished painting to avoid a white flash.
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // Development: load Vite dev server
    win.loadURL(DEV_URL);

    // Open DevTools automatically in development
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load the built React app from web/dist
    win.loadFile(PROD_FILE);
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create the window when the dock icon is clicked and no windows
  // are open (standard macOS behaviour).
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS where apps stay alive
// in the dock until the user quits explicitly with Cmd+Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
