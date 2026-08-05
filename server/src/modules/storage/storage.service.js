// =============================================================================
// storage.service.js — AWS S3 Infrastructure Service
//
// Responsibility:
//   This is the ONLY module in the application that communicates with AWS S3.
//   It wraps the four S3 operations needed by Fileex and translates raw AWS
//   SDK errors into typed StorageError subclasses.
//
// WHY THIS ABSTRACTION EXISTS:
//   Business services (FileService, FolderService, TrashService) need to
//   generate presigned URLs, verify object existence, and delete objects —
//   but they must not know that AWS S3 is the underlying provider.
//   Isolating all AWS SDK usage here means:
//     1. Provider migration (S3 → R2 → MinIO) only touches this file.
//     2. Business services can be unit-tested by mocking this service alone.
//     3. If AWS SDK version requirements change, only this module is affected.
//
// WHY THIS IS NOT A REPOSITORY:
//   Repositories own Prisma / MySQL access. This service owns S3 access.
//   The two concerns are separate infrastructure layers. Mixing them would
//   make transactions impossible (you cannot roll back an S3 PUT inside a
//   Prisma $transaction — the two systems do not share a commit protocol).
//
// PROVIDER SUBSTITUTION:
//   To switch from AWS S3 to MinIO or Cloudflare R2:
//     1. Update storage.config.js — point the S3Client at the new endpoint.
//        (Both MinIO and R2 expose an S3-compatible API.)
//     2. Change nothing else in the application.
//   The four method signatures and return shapes below are the stable contract
//   that the rest of the application depends on.
//
// ERROR HANDLING:
//   Raw AWS errors are never allowed to escape this module.
//   Every catch block converts the AWS exception into a StorageError subclass
//   so that callers can use instanceof instead of parsing AWS error codes.
//
// NO DATABASE ACCESS:
//   This service is pure S3 I/O. It never reads or writes Prisma models.
//   StorageStats, File records, and notifications are managed by the business
//   service that calls this module.
//
// See: docs/ARCHITECTURE.md §6 (Storage & S3 Integration Strategy)
// See: docs/ADR.md — ADR-003 (AWS S3 over database file storage)
// See: docs/ADR.md — ADR-007 (Two-phase presigned URL upload)
// =============================================================================

import { getSignedUrl }       from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import s3Client                    from './storage.config.js';
import { PRESIGNED_URL_EXPIRATION_SECONDS } from './storage.constants.js';
import {
  ObjectNotFoundError,
  UploadFailedError,
  StorageUnavailableError,
} from './storage.errors.js';

// Bucket name is read once at module load. storage.config.js has already
// validated that AWS_BUCKET_NAME is present, so this will never be undefined.
const BUCKET = process.env.AWS_BUCKET_NAME;

// ---------------------------------------------------------------------------
// generateUploadUrl
//
// Generates a presigned S3 PUT URL that allows the client to upload a single
// object directly to S3 without routing bytes through the backend server.
//
// WHY PRESIGNED URLS:
//   The backend never handles file bytes. A presigned URL delegates upload
//   authority to the client for exactly one object, for a limited time.
//   This keeps the backend stateless and horizontally scalable — no memory
//   pressure from streaming large files. See ADR-007 for the full rationale.
//
// WHY ContentType IS SET:
//   S3 will store the MIME type as object metadata. This enables correct
//   Content-Type headers when S3 serves the file directly to a browser
//   during preview or download. The client must PUT with a matching
//   Content-Type header, or S3 will reject the request (signature mismatch).
//
// @param {string} storageKey — immutable S3 object key (users/{userId}/files/{uuid})
// @param {string} mimeType   — MIME type of the file being uploaded
// @returns {{ uploadUrl: string, expiresIn: number }}
//   uploadUrl — presigned PUT URL valid for PRESIGNED_URL_EXPIRATION_SECONDS
//   expiresIn — expiry in seconds (echoed back so the client can display it)
// ---------------------------------------------------------------------------
const generateUploadUrl = async (storageKey, mimeType) => {
  try {
    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    });

    return {
      uploadUrl,
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    };
  } catch (err) {
    // TODO: Log original AWS error here once a logger is introduced.
    throw new UploadFailedError('Failed to generate upload URL.');
  }
};

// ---------------------------------------------------------------------------
// generateDownloadUrl
//
// Generates a presigned S3 GET URL that allows the client to download or
// stream an object directly from S3 without routing bytes through the backend.
//
// WHY PRESIGNED URLS FOR DOWNLOAD:
//   Same principle as upload — the backend returns a URL; the client fetches
//   the bytes directly from S3. This eliminates the backend as a bottleneck
//   for large file downloads and preview streaming.
//
// WHY THE URL EXPIRES:
//   A permanent public URL would make any file accessible forever to anyone
//   who obtains the link. The 15-minute expiry window ensures that even if
//   a URL leaks (browser history, proxy log), access is self-revoking.
//
// IMPORTANT — DOES NOT VERIFY OBJECT EXISTENCE:
//   This method generates a presigned URL unconditionally. It does NOT call
//   HeadObject to check whether the S3 object is actually present.
//
//   Reason: Presigned URL generation is a pure cryptographic signing
//   operation that does not require a network round-trip to S3. Adding an
//   existence check here would introduce an extra S3 API call on every
//   download or preview request, doubling latency for the common case.
//
//   CALLER CONTRACT: FileService must call objectExists() before calling
//   this method whenever the object's presence cannot be assumed (e.g.
//   after a failed or partial upload). For files with status = READY, the
//   object is guaranteed to exist by the upload confirmation flow.
//
// @param {string} storageKey — immutable S3 object key
// @returns {{ downloadUrl: string, expiresIn: number }}
// ---------------------------------------------------------------------------
const generateDownloadUrl = async (storageKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key:    storageKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    });

    return {
      downloadUrl,
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    };
  } catch (err) {
    // TODO: Log original AWS error here once a logger is introduced.
    throw new StorageUnavailableError('Failed to generate download URL.');
  }
};

// ---------------------------------------------------------------------------
// generatePreviewUrl
//
// Generates a presigned S3 GET URL intended for in-browser preview.
//
// MVP BEHAVIOUR:
//   Currently delegates to generateDownloadUrl() because both produce a
//   presigned GET URL with identical S3 parameters. The distinction exists
//   to keep the method signature stable in the contract between FileService
//   and StorageService. Future behaviour will differ:
//     - Preview: ResponseContentDisposition = "inline" (opens in browser)
//     - Download: ResponseContentDisposition = "attachment" (forces save)
//     - Preview: shorter expiry for images (faster cache invalidation)
//     - Preview: image transform parameters for thumbnail variants
//
// CALLER CONTRACT: Same as generateDownloadUrl — caller must ensure the
//   object exists (status = READY) before calling this method.
//
// @param {string} storageKey — immutable S3 object key
// @returns {{ previewUrl: string, expiresIn: number }}
// ---------------------------------------------------------------------------
const generatePreviewUrl = async (storageKey) => {
  try {
    // Delegate to the same GetObjectCommand for now.
    // Replace this body when preview-specific parameters are introduced.
    const { downloadUrl, expiresIn } = await generateDownloadUrl(storageKey);
    return { previewUrl: downloadUrl, expiresIn };
  } catch (err) {
    // generateDownloadUrl already wraps errors in StorageUnavailableError.
    // Re-throw as-is so callers see a consistent StorageError subclass.
    throw err;
  }
};

// ---------------------------------------------------------------------------
// objectExists
//
// Checks whether an object is present in S3 without downloading it.
//
// WHY HeadObjectCommand AND NOT GetObjectCommand:
//   HeadObject fetches only the object's metadata (HTTP headers) — it does
//   not transfer the object body. For a 500 MB file, GetObject would
//   download 500 MB just to confirm the object exists. HeadObject is O(1)
//   regardless of file size.
//
// RETURN VALUES:
//   true  — the object exists and is readable
//   false — S3 returned 404 (NoSuchKey / 404 NotFound)
//   throws StorageUnavailableError — any other AWS failure (permissions,
//           network error, 5xx from S3) that is not "object not found"
//
// CALLER CONTEXT:
//   Called by FileService.confirmUpload() during POST /upload/complete.
//   The service checks the return value and either transitions status to
//   READY (true) or throws UPLOAD_NOT_COMPLETED (false).
//
// @param {string} storageKey
// @returns {boolean}
// ---------------------------------------------------------------------------
const objectExists = async (storageKey) => {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key:    storageKey,
    }));

    return true;
  } catch (err) {
    // The AWS SDK v3 surfaces "not found" as either a 404 HTTP status or
    // the error name "NotFound" / "NoSuchKey". Check both to be safe.
    const isNotFound =
      err.$metadata?.httpStatusCode === 404 ||
      err.name === 'NotFound'               ||
      err.name === 'NoSuchKey';

    if (isNotFound) {
      return false;
    }

    // Any other error (403 AccessDenied, 5xx, network timeout) is an
    // infrastructure failure that the caller cannot recover from by changing
    // business logic.
    // TODO: Log original AWS error here once a logger is introduced.
    throw new StorageUnavailableError('Failed to verify object existence.');
  }
};

// ---------------------------------------------------------------------------
// deleteObject
//
// Permanently deletes an object from S3.
//
// WHY THIS DOES NOT TOUCH THE DATABASE:
//   S3 and MySQL are separate systems with no shared transaction boundary.
//   The caller (TrashService or FileService) is responsible for:
//     1. Calling this method to delete the S3 object.
//     2. Deleting or updating the database record within a Prisma transaction.
//   Doing both here would create an ambiguous failure mode: if the DB update
//   fails after the S3 delete succeeds, the object is gone but the record
//   remains. Separating the concerns lets the caller decide the correct
//   rollback/recovery strategy.
//
// IDEMPOTENCY:
//   S3 DeleteObject is idempotent — deleting a key that does not exist
//   returns 204 No Content rather than an error. This is intentional and
//   means retrying a failed delete is always safe.
//
// @param {string} storageKey — immutable S3 object key to delete
// @returns {void}
// ---------------------------------------------------------------------------
const deleteObject = async (storageKey) => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key:    storageKey,
    }));
  } catch (err) {
    // TODO: Log original AWS error here once a logger is introduced.
    throw new StorageUnavailableError('Failed to delete object.');
  }
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const storageService = {
  generateUploadUrl,
  generateDownloadUrl,
  generatePreviewUrl,
  objectExists,
  deleteObject,
};

export default storageService;
