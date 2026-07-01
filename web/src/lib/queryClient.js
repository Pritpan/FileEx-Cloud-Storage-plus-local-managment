import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance.
 *
 * Configuration rationale:
 * - staleTime: 5 minutes — avoids redundant refetches for file listings which
 *   don't change on every navigation.
 * - retry: 1 — retry once on network error, but not indefinitely (fail fast).
 * - refetchOnWindowFocus: false — file listings don't need to refetch every
 *   time the user alt-tabs back. We control refetch manually after mutations.
 *
 * See: docs/ARCHITECTURE.md §3.3
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
