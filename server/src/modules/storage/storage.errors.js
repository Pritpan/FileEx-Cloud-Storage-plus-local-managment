// =============================================================================
// storage.errors.js — Custom error classes for the Storage module
//
// Responsibility:
//   Define typed error classes that storage helpers and services will throw.
//   Typed errors allow the Service layer to distinguish S3 failures by kind
//   and respond with the correct HTTP status code and error code.
//
// USAGE PATTERN:
//   Errors are thrown by storage helpers (e.g. s3Helpers.js) and caught by
//   the Service layer, which maps them to typed HTTP responses via the global
//   error handler. Controllers and repositories never import these directly.
//
// WHY CUSTOM CLASSES INSTEAD OF PLAIN ERROR STRINGS:
//   `instanceof` checks let the Service layer branch cleanly:
//
//     } catch (err) {
//       if (err instanceof ObjectNotFoundError) {
//         throw createServiceError('Upload not confirmed.', 422, 'UPLOAD_NOT_COMPLETED');
//       }
//       throw err; // unexpected — rethrow for global error handler
//     }
//
//   A plain Error with a message string forces string matching, which is
//   fragile and breaks silently when messages change.
//
// NOTE:
//   These classes are placeholders. None of them are thrown yet.
//   They will be used once storage.helpers.js is implemented.
// =============================================================================

// ---------------------------------------------------------------------------
// StorageError — base class
//
// All storage errors extend this class. Catch StorageError to handle any
// S3-related failure regardless of its specific kind.
// ---------------------------------------------------------------------------
export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

// ---------------------------------------------------------------------------
// StorageConfigurationError
//
// Thrown when the S3 client cannot be initialised due to missing or invalid
// environment variables (e.g. bad region, malformed credentials).
//
// Expected response: 500 INTERNAL_ERROR
// This is a programming or deployment error — not a user-facing condition.
// ---------------------------------------------------------------------------
export class StorageConfigurationError extends StorageError {
  constructor(message) {
    super(message);
    this.name = 'StorageConfigurationError';
  }
}

// ---------------------------------------------------------------------------
// ObjectNotFoundError
//
// Thrown when a HeadObject or GetObject call confirms that the expected
// S3 object does not exist. This happens in POST /upload/complete when the
// client claimed to have uploaded a file but the object is absent in S3.
//
// Expected response: 422 UPLOAD_NOT_COMPLETED
// See: docs/API_SPEC.md — error code UPLOAD_NOT_COMPLETED
// ---------------------------------------------------------------------------
export class ObjectNotFoundError extends StorageError {
  constructor(message = 'The expected S3 object does not exist.') {
    super(message);
    this.name = 'ObjectNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// UploadFailedError
//
// Thrown when an S3 PutObject or presigned URL generation operation fails
// unexpectedly (e.g. network error, SDK error, permission denied).
//
// Expected response: 500 INTERNAL_ERROR
// Distinguished from ObjectNotFoundError: this indicates a failure during
// the upload attempt itself, not an absent object after the fact.
// ---------------------------------------------------------------------------
export class UploadFailedError extends StorageError {
  constructor(message = 'The S3 upload operation failed.') {
    super(message);
    this.name = 'UploadFailedError';
  }
}

// ---------------------------------------------------------------------------
// StorageUnavailableError
//
// Thrown when the S3 service is unreachable or returns a 5xx error.
// This typically indicates an AWS outage or a transient network issue.
//
// Expected response: 503 or 500 INTERNAL_ERROR
// The Service layer may choose to surface a user-friendly retry message.
// ---------------------------------------------------------------------------
export class StorageUnavailableError extends StorageError {
  constructor(message = 'The storage service is currently unavailable.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}
