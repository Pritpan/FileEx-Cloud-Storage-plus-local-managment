import { z } from 'zod';

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

  size: z
    .number({ required_error: 'File size is required.' })
    .int('File size must be an integer.')
    .positive('File size must be greater than 0.')
    .max(Number.MAX_SAFE_INTEGER, 'File size exceeds maximum safe integer.'),

  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});

export const CompleteUploadSchema = z.object({
  fileId: z
    .number({ required_error: 'File ID is required.' })
    .int('File ID must be an integer.')
    .positive('File ID must be a positive integer.'),
});

export const ListFilesQuerySchema = z.object({
  parentId: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'null') return null;
      const n = Number(val);
      return Number.isInteger(n) && n > 0 ? n : val;
    },
    z
      .number({ invalid_type_error: 'Parent ID must be a positive integer.' })
      .int('Parent ID must be an integer.')
      .positive('Parent ID must be a positive integer.')
      .nullable(),
  ),
});

const displayNameField = z
  .string({ required_error: 'Display name is required.' })
  .trim()
  .min(1, 'Display name must not be empty.')
  .max(255, 'Display name must not exceed 255 characters.');

export const CreateFolderSchema = z.object({
  displayName: displayNameField,

  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});

export const RenameSchema = z.object({
  displayName: displayNameField,
});

export const MoveSchema = z.object({
  parentId: z
    .number({ invalid_type_error: 'Parent ID must be a number.' })
    .int('Parent ID must be an integer.')
    .positive('Parent ID must be a positive integer.')
    .nullable()
    .default(null),
});

export const SearchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required.' })
    .trim()
    .min(1, 'Search query must not be empty.')
    .max(255, 'Search query must not exceed 255 characters.'),

  parentId: z.preprocess(
    (val) => {
      if (val === undefined || val === '') return undefined;
      if (val === 'null') return null;
      const n = Number(val);
      return Number.isInteger(n) && n > 0 ? n : val;
    },
    z
      .number({ invalid_type_error: 'Parent ID must be a positive integer.' })
      .int('Parent ID must be an integer.')
      .positive('Parent ID must be a positive integer.')
      .nullable()
      .optional()
  ),
});
