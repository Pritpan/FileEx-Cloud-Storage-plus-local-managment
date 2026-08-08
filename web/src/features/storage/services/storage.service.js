import api from '@/lib/axios';
import { STORAGE } from '@/constants/api';

/**
 * storage.service.js
 *
 * Communicates with the backend Storage APIs.
 *
 * Backend response shape:
 * {
 *   success: true,
 *   data: {
 *     totalBytes: number,
 *     usedBytes: number,
 *     totalFiles: number,
 *     totalFolders: number
 *   }
 * }
 */
export const storageService = {
  getStats: async () => {
    const { data } = await api.get(STORAGE.STATS);
    return data.data;
  },
};
