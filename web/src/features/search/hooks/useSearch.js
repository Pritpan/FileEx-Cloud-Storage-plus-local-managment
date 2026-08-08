import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';

/**
 * Query key factory for search.
 * Cached separately per trimmed query string.
 */
export const searchKeys = {
  results: (query) => ['search', query],
};

/**
 * useSearch — fetches search results using TanStack Query.
 *
 * @param {string} query - The debounced, already-trimmed search string
 */
export function useSearch(query) {
  const trimmed = (query ?? '').trim();

  return useQuery({
    queryKey: searchKeys.results(trimmed),
    queryFn: () => searchService.searchFiles(trimmed),
    // Only fire the request when the query has at least 1 character
    enabled: trimmed.length > 0,
    // Do NOT use placeholderData — it causes stale results from a
    // different query to appear while the new fetch is in-flight.
    staleTime: 1000 * 30, // Cache for 30 seconds per query string
  });
}
