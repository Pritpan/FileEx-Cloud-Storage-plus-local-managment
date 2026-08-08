import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { previewService } from '../services/preview.service';

/**
 * usePreview — fetches a presigned preview URL and manages dialog state.
 *
 * @returns {{ item, previewUrl, isLoading, open, openPreview, closePreview }}
 */
export function usePreview() {
  const [state, setState] = useState({
    open: false,
    item: null,
    previewUrl: null,
    isLoading: false,
    isError: false,
  });

  const openPreview = useCallback(async (item) => {
    // Immediately open the dialog in a loading state
    setState({ open: true, item, previewUrl: null, isLoading: true, isError: false });

    try {
      const { url } = await previewService.getPreviewUrl(item.id);
      setState((s) => ({ ...s, previewUrl: url, isLoading: false }));
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Could not load preview.';
      toast.error(message);
      setState((s) => ({ ...s, isLoading: false, isError: true }));
    }
  }, []);

  const closePreview = useCallback(() => {
    setState({ open: false, item: null, previewUrl: null, isLoading: false, isError: false });
  }, []);

  return { ...state, openPreview, closePreview };
}
