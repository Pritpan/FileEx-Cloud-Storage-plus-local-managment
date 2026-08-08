import api from '@/lib/axios';
import { FILES } from '@/constants/api';

/**
 * search.service.js
 *
 * Communicates with the backend search endpoint.
 * No UI logic, no React logic.
 *
 * Backend response: { success: true, data: File[] }
 */
export const searchService = {
  /**
   * Search files and folders by query string.
   * @param {string} query
   * @returns {Promise<object[]>} Array of file/folder records
   */
  searchFiles: async (query) => {
    const { data } = await api.get(FILES.SEARCH, {
      params: { q: query },
    });
    return data.data; // backend returns { success, data: [...] }
  },
};
