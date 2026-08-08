/**
 * Classify a file by its MIME type or extension for preview rendering.
 *
 * @param {object} item - File record from the API
 * @returns {'image' | 'pdf' | 'text' | 'unsupported'}
 */
export function getPreviewType(item) {
  const mime = item.mimeType || '';
  const name = item.displayName || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.startsWith('text/') ||
    /\.(txt|md|csv|js|ts|jsx|tsx|json|xml|html|css|sh|yaml|yml|env)$/i.test(name)
  ) {
    return 'text';
  }

  return 'unsupported';
}
