import { useQuery } from '@tanstack/react-query';
import { storageService } from '../services/storage.service';

export const storageKeys = {
  all: () => ['storage'],
};

export function useStorage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: storageKeys.all(),
    queryFn: storageService.getStats,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    stats: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
