import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { explorerService } from '../services/explorer.service';
import { filesKeys } from './useFiles';

/**
 * useDeleteFile
 *
 * Mutation hook for soft-deleting (trashing) a file or folder.
 * On success: invalidates the current folder cache so the item disappears.
 *
 * @param {number|null} currentFolderId - The folder currently displayed.
 */
export function useDeleteFile(currentFolderId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => explorerService.deleteFile({ id }),

    onSuccess: (_, variables) => {
      // Invalidate the parent folder's file list to remove the deleted item
      queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(variables.currentFolderId ?? currentFolderId) });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      toast.success('Item moved to Trash.');
    },

    onError: (err) => {
      const message =
        err?.response?.data?.error?.message ||
        'Failed to delete item. Please try again.';
      toast.error(message);
    },
  });
}
