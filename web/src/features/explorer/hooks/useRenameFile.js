import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { explorerService } from '../services/explorer.service';
import { filesKeys } from './useFiles';

/**
 * useRenameFile
 *
 * Mutation hook for renaming any file or folder.
 * On success: invalidates the current folder cache so the updated
 * display name appears without a manual refresh.
 *
 * @param {number|null} currentFolderId - The folder currently displayed in the explorer.
 */
export function useRenameFile(currentFolderId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, displayName }) =>
      explorerService.renameFile({ id, displayName }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(currentFolderId) });
      toast.success('Item renamed successfully.');
    },

    onError: (err) => {
      const message =
        err?.response?.data?.error?.message ||
        'Failed to rename. Please try again.';
      toast.error(message);
    },
  });
}
