import { useQuery } from '@tanstack/react-query';
import { explorerService } from '../services/explorer.service';

export const filesKeys = {
  root: () => ['files', null],
  folder: (id) => ['files', id],
  ofFolder: (id) => id === null || id === undefined ? filesKeys.root() : filesKeys.folder(id),
};

export function useFiles(folderId = null) {
  const query = useQuery({
    queryKey: filesKeys.ofFolder(folderId),
    queryFn: () => explorerService.getFiles(folderId),
  });

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
