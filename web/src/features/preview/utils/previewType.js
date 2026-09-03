/**
 * Classify a file by its MIME type or extension for preview rendering.
 *
 * @param {object} item - File record from the API
 * @returns {'image' | 'pdf' | 'text' | 'video' | 'unsupported'}
 */
export function getPreviewType(item) {
  const mime = item.mimeType || '';
  const name = item.displayName || '';

  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) {
    return 'image';
  }
  
  if (mime.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(name)) {
    return 'video';
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mime.startsWith('text/') ||
    /\.(txt|md|csv|js|ts|jsx|tsx|json|xml|html|css|sh|yaml|yml|env)$/i.test(name)
  ) {
    return 'text';
  }

  return 'unsupported';
}
