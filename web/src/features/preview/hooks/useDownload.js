import { useCallback } from 'react';
import { toast } from 'sonner';
import { previewService } from '../services/preview.service';

/**
 * useDownload — fetches a presigned download URL and triggers a native browser download.
 */
export function useDownload() {
  const downloadFile = useCallback(async (item) => {
    const toastId = toast.loading(`Preparing download for ${item.displayName}...`);

    try {
      const { url } = await previewService.getDownloadUrl(item.id);

      // Fetch the file as a Blob to force a download instead of navigating.
      // This is necessary because the HTML5 'download' attribute is ignored for cross-origin URLs.
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file for download');
      
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);

      // Trigger native browser download using the local Blob URL
      const anchor = document.createElement('a');
      anchor.href = localUrl;
      anchor.download = item.displayName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Clean up the object URL to free memory
      setTimeout(() => window.URL.revokeObjectURL(localUrl), 1000);

      toast.success(`Downloading ${item.displayName}`, { id: toastId });
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Could not start download.';
      toast.error(message, { id: toastId });
    }
  }, []);

  return { downloadFile };
}
