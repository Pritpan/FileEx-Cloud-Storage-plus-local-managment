// =============================================================================
// file.schema.js — Zod validation schemas for the Files module
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// InitiateUploadSchema — POST /api/v1/files/upload/initiate
//
// Validates the body sent by the client before the service runs any
// business logic. All four fields are required at the schema level;
// parentId defaults to null when absent to represent the root folder.
// ---------------------------------------------------------------------------
export const InitiateUploadSchema = z.object({
  displayName: z
    .string({ required_error: 'Display name is required.' })
    .trim()
    .min(1, 'Display name must not be empty.')
    .max(255, 'Display name must not exceed 255 characters.'),

  mimeType: z
    .string({ required_error: 'MIME type is required.' })
    .trim()
    .min(1, 'MIME type must not be empty.')
    .max(255, 'MIME type must not exceed 255 characters.'),

  // size is validated as a JS number here (JSON has no BigInt).
  // JavaScript Numbers cannot safely represent integers larger than
  // Number.MAX_SAFE_INTEGER. The service will continue converting the
  // validated value to BigInt before writing to the database and
  // before comparing against the BigInt columns in storage_stats.
  size: z
    .number({ required_error: 'File size is required.' })
    .int('File size must be an integer.')
    .positive('File size must be greater than 0.')
    .max(Number.MAX_SAFE_INTEGER, 'File size exceeds maximum safe integer.'),

  // parentId: null  →  upload to the user's root folder
  // parentId: N     →  upload into the folder with id = N
  // Absent key is treated identically to null (defaults to null).
  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});

// ---------------------------------------------------------------------------
// CompleteUploadSchema — POST /api/v1/files/upload/complete
//
// The only required field is fileId, which references the PENDING File record
// created during POST /upload/initiate. All other confirmation logic (S3
// existence check, quota accounting) is handled by the service.
// ---------------------------------------------------------------------------
export const CompleteUploadSchema = z.object({
  fileId: z
    .number({ required_error: 'File ID is required.' })
    .int('File ID must be an integer.')
    .positive('File ID must be a positive integer.'),
});

// ---------------------------------------------------------------------------
// ListFilesQuerySchema — GET /api/v1/files
//
// Query parameters always arrive as strings from Express (e.g. "123" not 123).
// z.preprocess runs before the inner schema so we can normalise the raw string:
//   - absent / "" / "null"  →  null   (browse root)
//   - "123"                 →  123    (browse folder 123)
//   - anything else         →  passed through as-is so Zod rejects it cleanly
// ---------------------------------------------------------------------------
export const ListFilesQuerySchema = z.object({
  parentId: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'null') return null;
      const n = Number(val);
      // Return the coerced number only if it is a safe positive integer.
      // Otherwise pass the original value through so Zod emits the typed error.
      return Number.isInteger(n) && n > 0 ? n : val;
    },
    z
      .number({ invalid_type_error: 'Parent ID must be a positive integer.' })
      .int('Parent ID must be an integer.')
      .positive('Parent ID must be a positive integer.')
      .nullable(),
  ),
});

// ---------------------------------------------------------------------------
// Shared: displayName field — reused by CreateFolderSchema and RenameSchema.
// Rejects whitespace-only names via .min(1) after .trim().
// ---------------------------------------------------------------------------
const displayNameField = z
  .string({ required_error: 'Display name is required.' })
  .trim()
  .min(1, 'Display name must not be empty.')
  .max(255, 'Display name must not exceed 255 characters.');

// ---------------------------------------------------------------------------
// CreateFolderSchema — POST /api/v1/files/folders
// ---------------------------------------------------------------------------
export const CreateFolderSchema = z.object({
  displayName: displayNameField,

  // null → create in virtual root; N → create inside folder N
  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});

// ---------------------------------------------------------------------------
// RenameSchema — PATCH /api/v1/files/:id/rename
// ---------------------------------------------------------------------------
export const RenameSchema = z.object({
  displayName: displayNameField,
});

// ---------------------------------------------------------------------------
// MoveSchema — PATCH /api/v1/files/:id/move
//
// parentId: null → move to virtual root; N → move into folder N.
// A missing key is treated as null (root), same as CreateFolder.
// ---------------------------------------------------------------------------
export const MoveSchema = z.object({
  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});
