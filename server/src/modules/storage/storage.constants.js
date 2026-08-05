// =============================================================================
// storage.constants.js — Shared constants for the Storage module
//
// Responsibility:
//   Define named constants used across the storage module.
//   Centralising these values avoids magic numbers scattered through
//   service and helper files, and makes future adjustments a one-line change.
//
// SCOPE:
//   These constants are internal to the storage module.
//   They must not be imported by other modules directly — the storage module
//   exposes behaviour, not raw configuration values.
// =============================================================================

// ---------------------------------------------------------------------------
// DEFAULT_STORAGE_LIMIT
//
// The default maximum storage allocation per user, in bytes.
// 104857600 bytes = 100 MiB (100 × 1024 × 1024).
//
// This value is also the Prisma schema default for StorageStats.storageLimit.
// Both values must remain in sync. If the default changes here, the schema
// default and any existing rows set to the old default must also be updated.
//
// See: docs/DATABASE_DESIGN.md §3.9
// See: prisma/schema.prisma — StorageStats.storageLimit @default(104857600)
// ---------------------------------------------------------------------------
export const DEFAULT_STORAGE_LIMIT = 104857600;

// ---------------------------------------------------------------------------
// PRESIGNED_URL_EXPIRATION_SECONDS
//
// How long a presigned S3 URL remains valid, in seconds.
// 900 seconds = 15 minutes.
//
// WHY 15 MINUTES:
//   A presigned URL grants anyone who holds it temporary, credential-free
//   access to a specific S3 object. The window must be:
//
//   - Long enough that a slow or mobile client can complete the upload
//     or download before the URL expires.
//   - Short enough that a leaked URL (e.g. from browser history or a
//     compromised TLS session) provides only a narrow attack window.
//
//   15 minutes is the industry-standard choice used by Dropbox, Linear,
//   and AWS's own documentation examples. It comfortably covers large
//   file uploads on slow connections (~50 MB at 500 kbps ≈ 13 minutes)
//   while expiring before an attacker can meaningfully exploit a stolen URL.
//
//   This value applies to both upload (PUT) presigned URLs from
//   POST /upload/initiate and download/preview (GET) presigned URLs from
//   GET /files/:id/download-url and GET /files/:id/preview-url.
//
// See: docs/ARCHITECTURE.md §6.1 (Two-Phase Upload Flow)
// See: docs/ARCHITECTURE.md §6.3 (Download / Preview Flow)
// ---------------------------------------------------------------------------
export const PRESIGNED_URL_EXPIRATION_SECONDS = 900;
