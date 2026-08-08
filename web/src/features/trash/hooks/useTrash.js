import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trashService } from '../services/trash.service';

// ── Query key ────────────────────────────────────────────────────────────────
export const trashKeys = {
  all: () => ['trash'],
};

// ── useTrash — fetch all trashed items ───────────────────────────────────────
export function useTrash() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: trashKeys.all(),
    queryFn: trashService.getTrash,
    staleTime: 1000 * 30,
  });

  return {
    items: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

// ── useRestore — restore a trashed item back to its original location ─────────
export function useRestore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => trashService.restoreFile(fileId),
    onSuccess: (_, fileId) => {
      toast.success('File restored successfully.');
      // Refresh trash list
      queryClient.invalidateQueries({ queryKey: trashKeys.all() });
      // Refresh all explorer views so the file appears back in its folder
      queryClient.invalidateQueries({ queryKey: ['files'] });
      // Refresh storage stats
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
    onError: (err) => {
      const message = err.response?.data?.error?.message || 'Could not restore file.';
      toast.error(message);
    },
  });
}

// ── useDeleteForever — permanently remove a trashed item ─────────────────────
export function useDeleteForever() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => trashService.deleteForever(fileId),
    onSuccess: () => {
      toast.success('File permanently deleted.');
      queryClient.invalidateQueries({ queryKey: trashKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
    onError: (err) => {
      const message = err.response?.data?.error?.message || 'Could not delete file.';
      toast.error(message);
    },
  });
}
