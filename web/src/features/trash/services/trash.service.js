import api from '@/lib/axios';
import { TRASH } from '@/constants/api';

/**
 * trash.service.js
 *
 * Communicates with the backend Trash endpoints.
 * No UI logic, no React logic.
 *
 * Backend response shapes:
 *   getTrash()       → { success: true, data: File[] }
 *   restoreFile()    → { success: true, data: File }
 *   deleteForever()  → { success: true, message: string }
 */
export const trashService = {
  getTrash: async () => {
    const { data } = await api.get(TRASH.LIST);
    return data.data; // array of trashed files
  },

  restoreFile: async (fileId) => {
    const { data } = await api.post(TRASH.RESTORE(fileId));
    return data.data;
  },

  deleteForever: async (fileId) => {
    const { data } = await api.delete(TRASH.PERMANENTLY_DELETE(fileId));
    return data;
  },
};
