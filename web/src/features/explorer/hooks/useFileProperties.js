import { useQuery } from '@tanstack/react-query';
import { explorerService } from '../services/explorer.service';

/**
 * useFileProperties
 *
 * Fetches the metadata/properties of a single file or folder.
 * 
 * @param {number|null} id
 * @param {boolean} isOpen - Only fetch when the dialog is actually open
 */
export function useFileProperties(id, isOpen) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => explorerService.getProperties(id),
    enabled: !!id && isOpen,
    staleTime: 60 * 1000,
  });
}
