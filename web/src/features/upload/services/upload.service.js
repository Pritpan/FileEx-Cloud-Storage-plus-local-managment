import api from '@/lib/axios';
import { FILES } from '@/constants/api';

export const uploadService = {
  initiateUpload: async ({ displayName, mimeType, size, parentId }) => {
    const { data } = await api.post(FILES.UPLOAD_INITIATE, {
      displayName,
      mimeType,
      size,
      parentId,
    });
    return data.data;
  },

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
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  },

  completeUpload: async ({ fileId }) => {
    const { data } = await api.post(FILES.UPLOAD_COMPLETE, { fileId });
    return data.data;
  },
};
