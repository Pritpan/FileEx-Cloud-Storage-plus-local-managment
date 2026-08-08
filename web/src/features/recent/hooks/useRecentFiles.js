import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { FILES } from '@/constants/api';

const fetchRecent = async () => {
  const { data } = await api.get(FILES.RECENT);
  return data.data; // File[]
};

export function useRecentFiles() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recent'],
    queryFn: fetchRecent,
    staleTime: 1000 * 30,
  });

  return {
    items: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
