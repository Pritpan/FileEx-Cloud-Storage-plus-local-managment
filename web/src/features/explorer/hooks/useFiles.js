import { useQuery } from '@tanstack/react-query';
import { explorerService } from '../services/explorer.service';

/**
 * Query key factory.
 *
 * Keeps cache keys consistent across the app.
 * Each unique folderId gets its own independent cache entry.
 *
 * Examples:
 *   filesKeys.root()            → ["files", null]
 *   filesKeys.folder(12)        → ["files", 12]
 */
export const filesKeys = {
  root: ()         => ['files', null],
  folder: (id)     => ['files', id],
  ofFolder: (id)   => id === null || id === undefined ? filesKeys.root() : filesKeys.folder(id),
};

/**
 * useFiles — custom hook for fetching file/folder listings.
 *
 * Pages and components should consume this hook exclusively.
 * Never call useQuery for files directly outside this file.
 *
 * @param {number|null} folderId - The current folder's ID, or null for root.
 * @returns {{ files, isLoading, isFetching, isError, error, refetch }}
 */
export function useFiles(folderId = null) {
  const query = useQuery({
    queryKey: filesKeys.ofFolder(folderId),
    queryFn:  () => explorerService.getFiles(folderId),
    // Each folder is independently cached. When folderId changes, React Query
    // either serves the cached result instantly or triggers a new fetch —
    // no manual loading state management needed.
  });

  return {
    files:      query.data ?? [],
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    isError:    query.isError,
    error:      query.error,
    refetch:    query.refetch,
  };
}
