import api from '@/lib/axios';
import { FILES } from '@/constants/api';

/**
 * preview.service.js
 *
 * Communicates with the backend to get presigned S3 URLs.
 * No UI logic, no Zustand logic.
 *
 * Backend response shape for both endpoints:
 *   { success: true, url: "https://...", expiresIn: 900 }
 */
export const previewService = {
  /**
   * Gets a presigned URL suitable for in-browser preview.
   * @param {number} fileId
   * @returns {Promise<{ url: string, expiresIn: number }>}
   */
  getPreviewUrl: async (fileId) => {
    const { data } = await api.get(FILES.PREVIEW_URL(fileId));
    // Backend returns: { success: true, url: "...", expiresIn: 900 }
    return data;
  },

  /**
   * Gets a presigned URL for downloading the file.
   * @param {number} fileId
   * @returns {Promise<{ url: string, expiresIn: number }>}
   */
  getDownloadUrl: async (fileId) => {
    const { data } = await api.get(FILES.DOWNLOAD_URL(fileId));
    // Backend returns: { success: true, url: "...", expiresIn: 900 }
    return data;
  },
};

