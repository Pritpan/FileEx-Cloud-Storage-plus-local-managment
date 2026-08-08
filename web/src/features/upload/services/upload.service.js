import api from '@/lib/axios';
import { FILES } from '@/constants/api';

/**
 * upload.service.js
 *
 * Handles API communication for the upload workflow.
 */

export const uploadService = {
  /**
   * Initiates an upload with the backend.
   * @param {{ displayName: string, mimeType: string, size: number, parentId: number|null }} payload
   * @returns {Promise<{ fileId: number, uploadUrl: string, expiresIn: number }>}
   */
  initiateUpload: async ({ displayName, mimeType, size, parentId }) => {
    const { data } = await api.post(FILES.UPLOAD_INITIATE, {
      displayName,
      mimeType,
      size,
      parentId,
    });
    return data.data;
  },

  /**
   * Uploads the file directly to S3 via the presigned URL.
   * Uses native XHR instead of axios to avoid adding extra headers that
   * would break the S3 presigned signature (axios adds Accept, etc).
   * @param {string} presignedUrl
   * @param {File} file
   * @param {Function} onProgress - called with 0-100 progress value
   * @returns {Promise<void>}
   */
  uploadToS3: (presignedUrl, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        // S3 returns 200 for successful PUT
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during S3 upload. Check S3 CORS configuration.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted.'));
      });

      xhr.open('PUT', presignedUrl);
      // Set Content-Type to match what was signed by the backend
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  },

  /**
   * Confirms the upload is complete with the backend.
   * @param {{ fileId: number }} payload 
   * @returns {Promise<object>}
   */
  completeUpload: async ({ fileId }) => {
    const { data } = await api.post(FILES.UPLOAD_COMPLETE, { fileId });
    return data.data;
  },
};
