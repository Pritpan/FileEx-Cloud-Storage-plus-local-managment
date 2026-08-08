import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { explorerService } from '../services/explorer.service';
import { filesKeys } from './useFiles';

/**
 * useMoveFile
 *
 * Mutation hook for moving a file or folder to a different parent.
 * On success: invalidates BOTH the source and destination folder caches
 * so the item disappears from the source and appears at the destination.
 *
 * @param {number|null} currentFolderId - The folder the item is being moved FROM.
 */
export function useMoveFile(currentFolderId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, parentId }) =>
      explorerService.moveFile({ id, parentId }),

    onSuccess: (_data, variables) => {
      // Invalidate source folder (item disappears here)
      queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(currentFolderId) });
      // Invalidate destination folder (item appears there)
      if (variables.parentId !== currentFolderId) {
        queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(variables.parentId) });
      }
      toast.success('Item moved successfully.');
    },

    onError: (err) => {
      const message =
        err?.response?.data?.error?.message ||
        'Failed to move item. Please try again.';
      toast.error(message);
    },
  });
}
