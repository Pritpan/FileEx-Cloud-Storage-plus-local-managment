/**
 * filesystem.service.js — E4: Local Filesystem API
 *
 * All Node.js filesystem operations for the Local Explorer live here.
 * This module is imported by main.js and called from ipcMain handlers.
 * It NEVER runs in the renderer; the renderer interacts with it only
 * through the IPC bridge established in preload.js.
 *
 * Design principles:
 *  - Every function returns a consistent envelope:
 *      { success: true,  data: ... }
 *      { success: false, error: { code, message } }
 *  - All paths are validated and normalised before use.
 *  - No shell commands (exec/spawn/PowerShell) are used.
 *  - No stack traces are forwarded to the renderer.
 *  - Errors are caught and converted to structured responses.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync, constants } from 'fs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * ok(data) — build a success envelope.
 */
function ok(data) {
  return { success: true, data };
}

/**
 * fail(code, message) — build an error envelope.
 * No stack traces forwarded to the renderer.
 */
function fail(code, message) {
  return { success: false, error: { code, message } };
}

/**
 * validatePath(p)
 * Rejects anything that is not a non-empty string.
 * Normalises the path for the current OS.
 * Does NOT restrict to a particular root — Fileex is a file manager
 * and legitimately needs access to arbitrary user-selected locations.
 */
function validatePath(p) {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error('INVALID_PATH');
  }
  return path.normalize(p.trim());
}

/**
 * fsErrorEnvelope(err, fallbackCode)
 * Maps Node.js errno codes to a clean renderer-facing error envelope.
 */
function fsErrorEnvelope(err, fallbackCode = 'FS_ERROR') {
  const codeMap = {
    ENOENT:  'NOT_FOUND',
    EACCES:  'PERMISSION_DENIED',
    EPERM:   'PERMISSION_DENIED',
    EEXIST:  'ALREADY_EXISTS',
    ENOTEMPTY: 'NOT_EMPTY',
    EINVAL:  'INVALID_PATH',
    ENOTDIR: 'NOT_A_DIRECTORY',
    EISDIR:  'IS_A_DIRECTORY',
    EBUSY:   'FILE_BUSY',
    EXDEV:   'CROSS_DEVICE',       // rename across drives — handled internally
  };
  const code = codeMap[err.code] ?? fallbackCode;
  console.error(`[filesystem.service] ${err.code ?? fallbackCode}: ${err.message}`);
  return fail(code, err.message);
}

// ---------------------------------------------------------------------------
// 1. readDirectory
// ---------------------------------------------------------------------------

/**
 * readDirectory(dirPath)
 * Lists the immediate children of the given directory.
 * Each entry: { name, path, type, size, modifiedAt }
 *   - type: "file" | "folder" | "symlink"
 *   - size: bytes (0 for folders)
 *   - modifiedAt: ISO string
 */
export async function readDirectory(dirPath) {
  let normalized;
  try {
    normalized = validatePath(dirPath);
  } catch {
    return fail('INVALID_PATH', 'Path must be a non-empty string.');
  }

  try {
    const entries = await fs.readdir(normalized, { withFileTypes: true });

    const items = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(normalized, entry.name);
        const isDir  = entry.isDirectory();
        const isSym  = entry.isSymbolicLink();
        const type   = isSym ? 'symlink' : isDir ? 'folder' : 'file';

        // Only stat files to get size; folders show 0 to avoid recursion.
        let size = 0;
        let modifiedAt = null;
        try {
          const stat = await fs.stat(entryPath);
          size       = isDir ? 0 : stat.size;
          modifiedAt = stat.mtime.toISOString();
        } catch {
          // Inaccessible entry — still include it without metadata.
        }

        return { name: entry.name, path: entryPath, type, size, modifiedAt };
      }),
    );

    return ok(items);
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 2. getFileMetadata
// ---------------------------------------------------------------------------

/**
 * getFileMetadata(filePath)
 * Returns metadata for a single file or directory.
 * Does NOT read file contents.
 */
export async function getFileMetadata(filePath) {
  let normalized;
  try {
    normalized = validatePath(filePath);
  } catch {
    return fail('INVALID_PATH', 'Path must be a non-empty string.');
  }

  try {
    const stat = await fs.stat(normalized);
    const isDir = stat.isDirectory();

    return ok({
      name:       path.basename(normalized),
      path:       normalized,
      type:       isDir ? 'folder' : 'file',
      size:       isDir ? 0 : stat.size,
      createdAt:  stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString(),
    });
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 3. createDirectory
// ---------------------------------------------------------------------------

/**
 * createDirectory(dirPath)
 * Creates the requested directory.
 * { recursive: true } means nested paths are created in one call,
 * and calling it on an already-existing directory is a no-op (not an error).
 */
export async function createDirectory(dirPath) {
  let normalized;
  try {
    normalized = validatePath(dirPath);
  } catch {
    return fail('INVALID_PATH', 'Path must be a non-empty string.');
  }

  try {
    await fs.mkdir(normalized, { recursive: true });
    return ok({ path: normalized });
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 4. rename
// ---------------------------------------------------------------------------

/**
 * rename(oldPath, newPath)
 * Renames (or moves within the same volume) a file or directory.
 * Cross-device moves should use the move() API instead.
 */
export async function rename(oldPath, newPath) {
  let normalOld, normalNew;
  try {
    normalOld = validatePath(oldPath);
    normalNew = validatePath(newPath);
  } catch {
    return fail('INVALID_PATH', 'Both paths must be non-empty strings.');
  }

  try {
    await fs.rename(normalOld, normalNew);
    return ok({ oldPath: normalOld, newPath: normalNew });
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 5. delete
// ---------------------------------------------------------------------------

/**
 * delete(targetPath)
 * Deletes a file or directory (including non-empty directories).
 *
 * Safety behaviour:
 *  - { force: false } — ENOENT is treated as an error, not silently ignored.
 *    The renderer must have intended to delete something that exists.
 *  - { recursive: true } — required for non-empty directories.
 *    This is intentional: the Local Explorer will need to delete folders.
 *
 * This is a permanent delete (not Trash/Recycle Bin). A Trash integration
 * can be considered in a later phase using the `trash` package if needed.
 */
export async function deleteEntry(targetPath) {
  let normalized;
  try {
    normalized = validatePath(targetPath);
  } catch {
    return fail('INVALID_PATH', 'Path must be a non-empty string.');
  }

  try {
    await fs.rm(normalized, { recursive: true, force: false });
    return ok({ path: normalized });
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 6. copy
// ---------------------------------------------------------------------------

/**
 * copy(sourcePath, destinationPath)
 * Copies a file or directory to the destination.
 * Uses fs.cp() which supports { recursive: true } for directory trees.
 * Available in Node 16.7+ (Electron 44 bundles Node 20+).
 *
 * { errorOnExist: true } — refuses to silently overwrite an existing target.
 * { recursive: true }    — copies directory trees.
 */
export async function copy(sourcePath, destinationPath) {
  let normalSrc, normalDest;
  try {
    normalSrc  = validatePath(sourcePath);
    normalDest = validatePath(destinationPath);
  } catch {
    return fail('INVALID_PATH', 'Both paths must be non-empty strings.');
  }

  try {
    await fs.cp(normalSrc, normalDest, {
      recursive:     true,
      errorOnExist:  false,   // allow overwrite — user chose destination via dialog
      preserveTimestamps: true,
    });
    return ok({ sourcePath: normalSrc, destinationPath: normalDest });
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 7. move
// ---------------------------------------------------------------------------

/**
 * move(sourcePath, destinationPath)
 * Moves a file or directory.
 *
 * Strategy:
 *   1. Try fs.rename() — fast, atomic, works within the same volume.
 *   2. If EXDEV (cross-device / cross-drive on Windows), fall back to
 *      copy() + delete() — safe for cross-drive operations.
 */
export async function move(sourcePath, destinationPath) {
  let normalSrc, normalDest;
  try {
    normalSrc  = validatePath(sourcePath);
    normalDest = validatePath(destinationPath);
  } catch {
    return fail('INVALID_PATH', 'Both paths must be non-empty strings.');
  }

  try {
    await fs.rename(normalSrc, normalDest);
    return ok({ sourcePath: normalSrc, destinationPath: normalDest });
  } catch (err) {
    if (err.code === 'EXDEV') {
      // Cross-device move: copy then delete the source.
      console.log('[filesystem.service] EXDEV detected — falling back to copy+delete for move.');
      try {
        await fs.cp(normalSrc, normalDest, { recursive: true, preserveTimestamps: true });
        await fs.rm(normalSrc, { recursive: true, force: false });
        return ok({ sourcePath: normalSrc, destinationPath: normalDest });
      } catch (fallbackErr) {
        return fsErrorEnvelope(fallbackErr);
      }
    }
    return fsErrorEnvelope(err);
  }
}

// ---------------------------------------------------------------------------
// 8. searchFiles — E6.3: Local Search
// ---------------------------------------------------------------------------

/**
 * searchFiles(dirPath, query, options?)
 *
 * Recursively searches `dirPath` for files/folders whose name contains
 * `query` (case-insensitive).
 *
 * Performance constraints enforced in Main Process:
 *   - maxDepth (default 6): never descends more than 6 levels to prevent
 *     runaway traversal on large drives.
 *   - maxResults (default 200): stops after 200 matches so the renderer is
 *     never flooded.
 *   - Skips entries it cannot stat (inaccessible system dirs) silently.
 *
 * Returns:
 *   { success: true,  data: Array<{ name, path, type, size, modifiedAt }> }
 *   { success: false, error: { code, message } }
 */
export async function searchFiles(dirPath, query, options = {}) {
  const { maxDepth = 6, maxResults = 200 } = options;

  let normalized;
  try {
    normalized = validatePath(dirPath);
  } catch {
    return fail('INVALID_PATH', 'dirPath must be a non-empty string.');
  }

  if (typeof query !== 'string' || query.trim() === '') {
    return fail('INVALID_QUERY', 'query must be a non-empty string.');
  }

  const lowerQuery = query.trim().toLowerCase();
  const results = [];

  async function walk(currentDir, depth) {
    if (depth > maxDepth || results.length >= maxResults) return;

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      // Permission denied or inaccessible — skip silently
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break;

      const entryPath = path.join(currentDir, entry.name);
      const isDir = entry.isDirectory();
      const isSym = entry.isSymbolicLink();
      const type  = isSym ? 'symlink' : isDir ? 'folder' : 'file';

      if (entry.name.toLowerCase().includes(lowerQuery)) {
        let size = 0;
        let modifiedAt = null;
        try {
          const stat = await fs.stat(entryPath);
          size       = isDir ? 0 : stat.size;
          modifiedAt = stat.mtime.toISOString();
        } catch {
          // Cannot stat — include with null metadata
        }
        results.push({ name: entry.name, path: entryPath, type, size, modifiedAt });
      }

      // Recurse into real directories (not symlinks — avoid cycles)
      if (isDir && !isSym) {
        await walk(entryPath, depth + 1);
      }
    }
  }

  try {
    await walk(normalized, 1);
    return ok(results);
  } catch (err) {
    return fsErrorEnvelope(err);
  }
}
