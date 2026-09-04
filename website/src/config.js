/**
 * FileEX Website — Centralized Configuration
 *
 * Create a `.env` file in `website/` and set:
 *
 *   # URL of the FileEX web application (browser-based file manager)
 *   VITE_FILEEX_WEB_URL=http://localhost:5174
 *
 *   # Release download URLs (activate the Download button)
 *   VITE_DOWNLOAD_URL_WINDOWS=https://...
 *   VITE_DOWNLOAD_URL_MAC=
 *   VITE_DOWNLOAD_URL_LINUX=
 *
 *   # Optional social/docs links
 *   VITE_GITHUB_URL=
 *   VITE_DOCS_URL=
 */

/** FileEX web application base URL — where /login and /register live */
const FILEEX_WEB_BASE =
  import.meta.env.VITE_FILEEX_WEB_URL || 'http://localhost:5174';

export const WEB_APP = {
  base:     FILEEX_WEB_BASE,
  login:    `${FILEEX_WEB_BASE}/login`,
  register: `${FILEEX_WEB_BASE}/register`,
  app:      `${FILEEX_WEB_BASE}/explorer`,
};

export const DOWNLOADS = {
  windows: import.meta.env.VITE_DOWNLOAD_URL_WINDOWS || null,
  mac:     import.meta.env.VITE_DOWNLOAD_URL_MAC     || null,
  linux:   import.meta.env.VITE_DOWNLOAD_URL_LINUX   || null,
};

export const SITE = {
  name: 'FileEX',
  tagline: 'Your Files. Your Machine. Your Cloud.',
  description:
    'FileEX is a desktop file manager that brings local and cloud storage together in one calm, unified experience.',
  github:  import.meta.env.VITE_GITHUB_URL  || null,
  docsUrl: import.meta.env.VITE_DOCS_URL    || null,
};
