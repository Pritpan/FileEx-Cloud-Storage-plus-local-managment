/**
 * useLocalClipboard.js — Local Explorer clipboard state
 *
 * Manages application-level clipboard state for local file Copy/Cut/Paste.
 * This is NOT the OS clipboard. It is React state local to the session.
 *
 * State shape:
 *   {
 *     operation: 'copy' | 'cut' | null,
 *     item: adapted local entry (has ._local.path, .displayName, etc.)
 *   }
 *
 * Paste semantics:
 *   copy → filesystem:copy(source, destination)
 *   cut  → filesystem:move(source, destination)
 *
 * Conflict handling:
 *   - Paste into self / ancestor is checked in React before calling IPC.
 *   - Destination existence is checked by the filesystem service (EEXIST error).
 *   - Source no longer exists is caught by the filesystem service (ENOENT error).
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useLocalClipboard() {
  const [clipboard, setClipboard] = useState({ operation: null, item: null });

  const copy = useCallback((item) => {
    setClipboard({ operation: 'copy', item });
    toast.info(`"${item.displayName}" copied. Navigate to destination and paste.`);
  }, []);

  const cut = useCallback((item) => {
    setClipboard({ operation: 'cut', item });
    toast.info(`"${item.displayName}" cut. Navigate to destination and paste.`);
  }, []);

  const clear = useCallback(() => {
    setClipboard({ operation: null, item: null });
  }, []);

  /**
   * paste(destinationDirPath, refresh)
   * Executes the clipboard operation into the given directory.
   */
  const paste = useCallback(async (destinationDirPath, refresh) => {
    const { operation, item } = clipboard;
    if (!operation || !item) {
      toast.warning('Nothing to paste.');
      return;
    }
    if (!window.electronAPI) return;

    const sourcePath = item._local.path;
    const fileName   = item.displayName;

    // Validate: prevent pasting into itself
    if (destinationDirPath === sourcePath) {
      toast.error('Cannot paste a folder into itself.');
      return;
    }

    // Validate: prevent pasting a folder into its own descendant
    const normalSource = sourcePath.replace(/[\\/]+$/, '');
    const normalDest   = destinationDirPath.replace(/[\\/]+$/, '');
    if (normalDest.startsWith(normalSource + '\\') || normalDest.startsWith(normalSource + '/')) {
      toast.error('Cannot paste a folder into one of its subfolders.');
      return;
    }

    // Build destination path
    const sep = destinationDirPath.includes('\\') ? '\\' : '/';
    const destinationPath = destinationDirPath.replace(/[\\/]+$/, '') + sep + fileName;

    try {
      let result;
      if (operation === 'copy') {
        result = await window.electronAPI.copy(sourcePath, destinationPath);
      } else {
        result = await window.electronAPI.move(sourcePath, destinationPath);
      }

      if (result.success) {
        toast.success(operation === 'copy'
          ? `"${fileName}" copied here.`
          : `"${fileName}" moved here.`
        );
        if (operation === 'cut') {
          // Clear clipboard after a successful cut+paste (move)
          setClipboard({ operation: null, item: null });
        }
        refresh?.();
      } else {
        const msg = result.error?.message ?? `${operation === 'copy' ? 'Copy' : 'Move'} failed.`;
        toast.error(msg);
      }
    } catch (err) {
      toast.error(err.message);
    }
  }, [clipboard]);

  return {
    clipboard,
    copy,
    cut,
    paste,
    clear,
    hasPaste: clipboard.operation !== null,
  };
}
