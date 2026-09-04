/**
 * API endpoint constants — FileEX
 *
 * All API endpoint strings are centralized here.
 * No feature file should hardcode a path string.
 *
 * Usage:
 *   import { AUTH, FILES } from '@/constants/api';
 *   api.post(AUTH.LOGIN, body)
 */

export const AUTH = {
  REGISTER:             '/auth/register',
  LOGIN:                '/auth/login',
  LOGOUT:               '/auth/logout',
  REFRESH:              '/auth/refresh',
  ME:                   '/auth/me',
  PASSWORD:             '/auth/password',
  VERIFY_EMAIL:         '/auth/verify-email',
  RESEND_VERIFICATION:  '/auth/resend-verification',
  DELETE_ACCOUNT:       '/auth/account',
};

export const FILES = {
  UPLOAD_INITIATE: '/files/upload/initiate',
  UPLOAD_COMPLETE: '/files/upload/complete',
  LIST:            '/files',
  SEARCH:          '/files/search',
  RECENT:          '/files/recent',
  FOLDERS:         '/files/folders',
  RENAME:          (id) => `/files/${id}/rename`,
  MOVE:            (id) => `/files/${id}/move`,
  DOWNLOAD_URL:    (id) => `/files/${id}/download-url`,
  PREVIEW_URL:     (id) => `/files/${id}/preview-url`,
  PROPERTIES:      (id) => `/files/${id}/properties`,
  DELETE:          (id) => `/files/${id}`,
};

export const TRASH = {
  LIST:             '/files/trash',
  RESTORE:          (id) => `/files/trash/${id}/restore`,
  PERMANENTLY_DELETE: (id) => `/files/trash/${id}`,
};

export const STORAGE = {
  STATS: '/storage/stats',
};
