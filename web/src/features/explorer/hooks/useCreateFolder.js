import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { explorerService } from '../services/explorer.service';
import { filesKeys } from './useFiles';

/**
 * useCreateFolder
 *
 * Mutation hook for creating a new folder inside the current folder.
 * On success: invalidates the current folder's query cache so the new
 * folder appears without a manual refresh.
 *
 * @param {number|null} currentFolderId - The folder the user is currently viewing.
 */
export function useCreateFolder(currentFolderId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ displayName }) =>
      explorerService.createFolder({ displayName, parentId: currentFolderId }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.ofFolder(currentFolderId) });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      toast.success('Folder created successfully.');
    },

    onError: (err) => {
      const message =
        err?.response?.data?.error?.message ||
        'Failed to create folder. Please try again.';
      toast.error(message);
    },
  });
}
