/**
 * mimeFromPath.js — derive a MIME type from a local file path/name.
 *
 * Used when uploading local files to cloud; the backend stores mimeType
 * and uses it for Content-Type. The list is intentionally minimal and covers
 * the most common office/media formats. Unknown extensions fall back to
 * 'application/octet-stream'.
 */

const MIME_MAP = {
  // Text
  txt:  'text/plain',
  md:   'text/markdown',
  csv:  'text/csv',
  html: 'text/html',
  css:  'text/css',
  js:   'text/javascript',
  ts:   'text/typescript',
  json: 'application/json',
  xml:  'application/xml',
  // Images
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
  // Documents
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:  'application/vnd.ms-powerpoint',
  // Archives
  zip:  'application/zip',
  gz:   'application/gzip',
  tar:  'application/x-tar',
  rar:  'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  // Audio
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  m4a:  'audio/mp4',
  // Video
  mp4:  'video/mp4',
  mkv:  'video/x-matroska',
  avi:  'video/x-msvideo',
  mov:  'video/quicktime',
  webm: 'video/webm',
};

/**
 * @param {string} fileNameOrPath
 * @returns {string} MIME type
 */
export function mimeFromPath(fileNameOrPath) {
  const ext = fileNameOrPath.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}
