import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUploadStore } from '../store/upload.store';
import { uploadService } from '../services/upload.service';
import { filesKeys } from '@/features/explorer/hooks/useFiles';

export function useUpload() {
  const queryClient = useQueryClient();
  const { addUpload, updateProgress, updateStatus, setError } = useUploadStore();

  const processUpload = async (file, parentId, uploadId) => {
    try {
      updateStatus(uploadId, 'INITIATING');
      const initiateData = await uploadService.initiateUpload({
        displayName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        parentId,
      });

      updateStatus(uploadId, 'UPLOADING');
      await uploadService.uploadToS3(
        initiateData.uploadUrl,
        file,
        (progress) => updateProgress(uploadId, progress)
      );

      updateStatus(uploadId, 'COMPLETING');
      await uploadService.completeUpload({ fileId: initiateData.fileId });

      updateStatus(uploadId, 'COMPLETED');
      updateProgress(uploadId, 100);
      
      queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(parentId) });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      
    } catch (error) {
      console.error('Upload failed:', error);
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        'Upload failed';
      setError(uploadId, message);
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const uploadFiles = useCallback(
    (files, parentId) => {
      const fileArray = Array.from(files);

      fileArray.forEach((file) => {
        const uploadId = crypto.randomUUID();

        addUpload({
          id: uploadId,
          file,
          progress: 0,
          status: 'PENDING',
          error: null,
        });

        processUpload(file, parentId, uploadId);
      });
    },
    [addUpload, queryClient]
  );

  return { uploadFiles };
}
