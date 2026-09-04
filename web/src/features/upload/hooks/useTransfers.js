/**
 * useTransfers.js — E6: Local ↔ Cloud Transfers
 *
 * Provides two functions:
 *   uploadLocalToCloud(localPath, fileName, mimeType, fileSize, parentFolderId)
 *   downloadCloudToLocal(item, localRefresh)
 *
 * Architecture decisions:
 *
 *  Local → Cloud:
 *    1. React calls existing uploadService.initiateUpload() → gets presigned PUT URL + fileId.
 *    2. React calls window.electronAPI.uploadLocalFile() → Main streams local file to S3.
 *       No file data enters the renderer or IPC.
 *    3. Progress comes back via onTransferProgress IPC events → fed into upload store.
 *    4. On success React calls uploadService.completeUpload() (owns auth token).
 *    5. TanStack Query cache is invalidated → Cloud Explorer refreshes.
 *
 *  Cloud → Local:
 *    1. React calls existing previewService.getDownloadUrl() → gets presigned GET URL.
 *    2. React calls window.electronAPI.saveFile() → user picks destination.
 *    3. React calls window.electronAPI.downloadToLocal() → Main streams S3 to disk.
 *    4. Progress comes back via onTransferProgress → fed into upload store.
 *    5. After success, localRefresh() is called → Local Explorer refreshes.
 *
 * The upload store (useUploadStore) is reused for both directions because its
 * UI (UploadQueue / UploadItem) is already generic — it just renders progress.
 *
 * Security:
 *  - window.electronAPI.uploadLocalFile / downloadToLocal receive only a presigned URL.
 *  - No AWS credentials, no SDK, no raw S3 access from Main.
 *  - contextIsolation: true / nodeIntegration: false unchanged.
 */

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUploadStore } from '../store/upload.store';
import { uploadService } from '../services/upload.service';
import { previewService } from '@/features/preview/services/preview.service';
import { filesKeys } from '@/features/explorer/hooks/useFiles';

// ── Progress subscription hook ────────────────────────────────────────────────
// Registers once per mount and routes progress events to the store.
// All useTransfers callers share a single subscription by mounting
// TransferProgressProvider at the app root level.

export function useTransferProgressBridge() {
  const { updateProgress, updateStatus } = useUploadStore();

  useEffect(() => {
    if (!window.electronAPI?.onTransferProgress) return;

    const unsubscribe = window.electronAPI.onTransferProgress(
      ({ transferId, percent }) => {
        updateProgress(transferId, percent);
      }
    );

    return unsubscribe;
  }, [updateProgress]);
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useTransfers() {
  const queryClient = useQueryClient();
  const { addUpload, updateProgress, updateStatus, setError } = useUploadStore();

  // ── Local → Cloud ─────────────────────────────────────────────────────────
  const uploadLocalToCloud = useCallback(
    async (localPath, fileName, mimeType, fileSize, parentFolderId) => {
      if (!window.electronAPI) {
        toast.error('Local uploads require the FileEX desktop app.');
        return;
      }

      const transferId = crypto.randomUUID();

      addUpload({
        id:       transferId,
        file:     null,
        label:    fileName,
        size:     fileSize,
        progress: 0,
        status:   'PENDING',
        error:    null,
      });

      try {
        // Step 1: Obtain presigned PUT URL from backend (uses existing auth)
        updateStatus(transferId, 'INITIATING');
        const initiateData = await uploadService.initiateUpload({
          displayName: fileName,
          mimeType:    mimeType || 'application/octet-stream',
          size:        fileSize,
          parentId:    parentFolderId,
        });

        // Step 2: Stream local file → S3 entirely in Main Process
        updateStatus(transferId, 'UPLOADING');
        const uploadResult = await window.electronAPI.uploadLocalFile({
          transferId,
          localPath,
          presignedUrl: initiateData.uploadUrl,
          mimeType:     mimeType || 'application/octet-stream',
          fileSize,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error?.message ?? 'Upload to S3 failed.');
        }

        // Step 3: Notify backend the upload is complete
        updateStatus(transferId, 'COMPLETING');
        await uploadService.completeUpload({ fileId: initiateData.fileId });

        // Step 4: Done
        updateStatus(transferId, 'COMPLETED');
        updateProgress(transferId, 100);
        toast.success(`"${fileName}" uploaded to cloud.`);

        // Step 5: Refresh Cloud Explorer
        queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(parentFolderId) });
        queryClient.invalidateQueries({ queryKey: ['storage'] });

      } catch (err) {
        console.error('[E6 upload]', err);
        const message =
          err.response?.data?.error?.message || err.message || 'Upload failed.';
        setError(transferId, message);
        toast.error(`Failed to upload "${fileName}": ${message}`);
      }
    },
    [addUpload, updateProgress, updateStatus, setError, queryClient]
  );

  // ── Cloud → Local ─────────────────────────────────────────────────────────
  const downloadCloudToLocal = useCallback(
    async (item, onLocalRefresh, destinationDirPath = null) => {
      if (!window.electronAPI) {
        toast.error('Local downloads require the FileEX desktop app.');
        return;
      }

      const transferId = crypto.randomUUID();

      try {
        // Step 1: Get presigned GET URL from backend (uses existing auth)
        const { url: presignedUrl } = await previewService.getDownloadUrl(item.id);

        let finalDestinationPath = null;

        if (destinationDirPath) {
          // Skip Save Dialog, construct path directly (for drag-and-drop)
          const sep = destinationDirPath.includes('\\') ? '\\' : '/';
          const candidatePath = destinationDirPath.replace(/[\\/]+$/, '') + sep + item.displayName;
          
          // Check for conflicts
          const stat = await window.electronAPI.getFileMetadata(candidatePath);
          if (stat.success) {
            // File already exists! Fall back to OS Save dialog using candidatePath as default
            const { canceled, filePath } = await window.electronAPI.saveFile({
              defaultFileName: candidatePath,
            });
            if (canceled || !filePath) return;
            finalDestinationPath = filePath;
          } else {
            finalDestinationPath = candidatePath;
          }
        } else {
          // Step 2: Let the user choose where to save (fallback/button click)
          const { canceled, filePath } = await window.electronAPI.saveFile({
            defaultFileName: item.displayName,
          });
          if (canceled || !filePath) return;
          finalDestinationPath = filePath;
        }

        // Step 3: Add to transfer queue now that we have a destination
        addUpload({
          id:       transferId,
          file:     null,
          label:    item.displayName,
          size:     item.size ?? 0,
          progress: 0,
          status:   'DOWNLOADING',
          error:    null,
        });

        // Step 4: Stream S3 → local disk entirely in Main Process
        const result = await window.electronAPI.downloadToLocal({
          transferId,
          presignedUrl,
          destinationPath: finalDestinationPath,
        });

        if (!result.success) {
          throw new Error(result.error?.message ?? 'Download failed.');
        }

        updateStatus(transferId, 'COMPLETED');
        updateProgress(transferId, 100);
        toast.success(`"${item.displayName}" downloaded.`);

        // Step 5: Refresh Local Explorer if a refresh callback was provided
        onLocalRefresh?.();

      } catch (err) {
        console.error('[E6 download]', err);
        const message =
          err.response?.data?.error?.message || err.message || 'Download failed.';
        // Only update store if the entry was added (past step 3)
        try { setError(transferId, message); } catch {}
        toast.error(`Failed to download "${item.displayName}": ${message}`);
      }
    },
    [addUpload, updateProgress, updateStatus, setError]
  );

  return { uploadLocalToCloud, downloadCloudToLocal };
}
