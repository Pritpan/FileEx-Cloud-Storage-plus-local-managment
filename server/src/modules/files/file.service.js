// =============================================================================
// file.service.js — Business logic for the Files module
//
// Responsibility:
//   This is the ONLY layer that orchestrates business rules for file operations.
//   It calls Repositories (database) and StorageService (S3) but never touches
//   req or res.
//
// IMPORTANT — S3 IS NOT TRANSACTIONAL:
//   MySQL and S3 have no shared commit protocol. The recommended order for
//   upload initiation is:
//     1. Validate (DB reads only — no writes yet)
//     2. Create File(PENDING) in MySQL
//     3. Generate presigned URL (S3 credential signing — no network call)
//   The PENDING record acts as the intent marker. If the presigned URL call
//   fails (extremely rare — it is local signing), the PENDING record will be
//   cleaned up by the Upload Recovery strategy.
// =============================================================================

import { randomUUID } from 'node:crypto';
import prisma from '../../config/prisma.js';

import fileRepository          from './file.repository.js';
import storageStatsRepository  from '../storage/storage-stats.repository.js';
import storageService          from '../storage/storage.service.js';
import { StorageError }        from '../storage/storage.errors.js';

// ---------------------------------------------------------------------------
// createServiceError — typed error the controller's handleService() inspects.
// Mirrors the same helper used in auth.service.js.
// ---------------------------------------------------------------------------
const createServiceError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

// ---------------------------------------------------------------------------
// toSafeFile — strips internal columns from a raw Prisma File record.
//
// Excluded fields:
//   storageKey — internal S3 key; must never be exposed to clients
//   ownerId    — implicit from the authenticated session
//   deletedAt  — soft-delete marker; active records always have null here
//
// size: Prisma returns BIGINT columns as BigInt. JSON.stringify() throws on
// BigInt values, so we convert to Number. Upload validation guarantees that
// size <= Number.MAX_SAFE_INTEGER, so no precision is lost.
// ---------------------------------------------------------------------------
const toSafeFile = (file) => ({
  id:          file.id,
  displayName: file.displayName,
  type:        file.type,
  mimeType:    file.mimeType,
  size:        Number(file.size),
  status:      file.status,
  parentId:    file.parentId,
  createdAt:   file.createdAt,
  updatedAt:   file.updatedAt,
});

// ---------------------------------------------------------------------------
// initiateUpload
//
// Orchestrates every validation and setup step needed before a client can
// upload a file directly to S3 via a presigned URL.
//
// Step 1 — Validate parent folder
//   If parentId is supplied, confirm the target folder exists, belongs to
//   this user, is not soft-deleted, and has type = FOLDER. A parentId that
//   points to a soft-deleted record is treated as "not found" because
//   fileRepository.findById() already filters deletedAt: null.
//
// Step 2 — Check storage quota
//   Read the user's StorageStats row and assert:
//     usedStorage + requestedSize <= storageLimit
//   The comparison operates entirely in BigInt arithmetic because both
//   usedStorage and storageLimit are BIGINT columns returned as BigInt by
//   Prisma. requestedSize arrives as a JS Number from the JSON body and is
//   converted to BigInt for the comparison.
//   No rounding, no percentage — quota enforcement is a simple byte count.
//
// Step 3 — Check for a duplicate filename
//   Query for any ACTIVE record with the same (ownerId, parentId, displayName).
//   Name uniqueness is not enforced by a DB constraint because soft-deleted
//   records would block new items with the same name. The Service layer owns
//   this invariant.
//
// Step 4 — Generate immutable storageKey
//   storageKey = `users/${userId}/files/${randomUUID()}`
//   The UUID is random — it has no relation to the filename or path. This is
//   intentional (ADR-009): keys never change even if the file is renamed or
//   moved, so S3 objects and signed URLs remain valid across renames.
//
// Step 5 — Create File record with status = PENDING
//   The PENDING record is the "intent" marker. The upload is not confirmed
//   until POST /upload/complete transitions status to READY.
//   uploadStartedAt is set to now() — the DB column has no server default
//   after the refinement migration, so the service must supply it.
//
// Step 6 — Generate presigned upload URL
//   storageService.generateUploadUrl() performs local credential signing and
//   does not make a network call to S3. Failures here are rare but possible
//   (e.g. misconfigured credentials). If it throws, the PENDING record is
//   left in the database and will be purged by the Upload Recovery strategy.
//
// Step 7 — Return the response payload
//   The client receives the fileId (to reference the record in /complete),
//   the storageKey (immutable S3 key), the presigned uploadUrl, and the
//   expiry window in seconds.
//
// @param {object} data   — validated body: { displayName, mimeType, size, parentId }
// @param {string} userId — authenticated user's ID from req.user.id
// ---------------------------------------------------------------------------
export const initiateUpload = async ({ displayName, mimeType, size, parentId }, userId) => {

  // ── Step 1: Validate parent folder ───────────────────────────────────────
  if (parentId !== null) {
    const parent = await fileRepository.findById(parentId);

    // Not found, soft-deleted, or owned by a different user
    if (!parent || parent.ownerId !== userId) {
      throw createServiceError(
        'Parent folder not found.',
        404,
        'FOLDER_NOT_FOUND',
      );
    }

    // Exists but is a FILE — client sent a file ID instead of a folder ID
    if (parent.type !== 'FOLDER') {
      throw createServiceError(
        'The specified parent is not a folder.',
        422,
        'VALIDATION_ERROR',
      );
    }
  }

  // ── Step 2: Check storage quota ───────────────────────────────────────────
  const storageStats = await storageStatsRepository.findByUserId(userId);

  if (!storageStats) {
    // StorageStats is created atomically during registration.
    // A missing row is an internal consistency error, not a user error.
    throw createServiceError(
      'Storage stats not found. Please contact support.',
      500,
      'INTERNAL_ERROR',
    );
  }

  // Convert the JSON Number to BigInt for safe arithmetic with BIGINT columns.
  const requestedBytes = BigInt(size);

  if (storageStats.usedStorage + requestedBytes > storageStats.storageLimit) {
    throw createServiceError(
      'Upload would exceed your storage quota.',
      413,
      'QUOTA_EXCEEDED',
    );
  }

  // ── Step 3: Check for duplicate filename ─────────────────────────────────
  const duplicate = await fileRepository.findActiveByName(userId, parentId, displayName);
  if (duplicate) {
    throw createServiceError(
      `A file or folder named "${displayName}" already exists in this location.`,
      409,
      'NAME_CONFLICT',
    );
  }

  // ── Step 4: Generate immutable storageKey ─────────────────────────────────
  // The UUID is unrelated to the filename or folder path. The key is permanent —
  // renaming or moving the file in the app never changes the S3 object key.
  // See: docs/ADR.md — ADR-009
  const storageKey = `users/${userId}/files/${randomUUID()}`;

  // ── Step 5: Create File record (status = PENDING) ─────────────────────────
  // Wrap the database write inside a Prisma transaction to ensure atomicity.
  // Validation remains outside the transaction to minimize lock time.
  const file = await prisma.$transaction(async (tx) => {
    return await fileRepository.create({
      ownerId:         userId,
      parentId,
      displayName,
      storageKey,
      mimeType,
      size:            requestedBytes, // BigInt — matches Prisma schema type
      type:            'FILE',
      status:          'PENDING',
      uploadStartedAt: new Date(),
    }, tx);
  });

  // ── Step 6: Generate presigned upload URL ────────────────────────────────
  // getSignedUrl() is local credential signing — no network call to S3.
  // Must remain outside the transaction because S3 is not transactional.
  let uploadResult;
  try {
    uploadResult = await storageService.generateUploadUrl(storageKey, mimeType);
  } catch (err) {
    // If URL generation fails, delete the newly-created PENDING record.
    // We use permanentlyDelete() because the upload never actually started.
    await fileRepository.permanentlyDelete(file.id);

    if (err instanceof StorageError) {
      throw createServiceError(
        'Storage service is temporarily unavailable. Please try again.',
        503,
        'STORAGE_UNAVAILABLE',
      );
    }
    throw err; // unexpected — let the global error handler surface it
  }

  // ── Step 7: Return ────────────────────────────────────────────────────────
  return {
    success: true,
    data: {
      fileId:    file.id,
      storageKey: file.storageKey,
      uploadUrl:  uploadResult.uploadUrl,
      expiresIn:  uploadResult.expiresIn,
    },
  };
};

// ---------------------------------------------------------------------------
// confirmUpload
//
// Phase 2 of the two-phase upload flow.
// Called after the client has uploaded the file bytes directly to S3 using
// the presigned URL obtained from POST /upload/initiate.
//
// Step 1 — Load and validate the File record
//   Find the record by ID. Verify it exists, belongs to the authenticated
//   user, is not soft-deleted, has type = FILE, and has status = PENDING.
//   Any deviation produces a typed error with a specific code:
//     - Not found / deleted          → 404 FILE_NOT_FOUND
//     - Belongs to another user      → 403 FORBIDDEN
//     - Already READY                → 409 FILE_ALREADY_READY
//     - Already FAILED               → 409 FILE_ALREADY_FAILED
//
// Step 2 — Verify the S3 object exists (HeadObject)
//   storageService.objectExists() is called OUTSIDE the transaction because
//   S3 and MySQL have no shared commit protocol. If the object is missing:
//     - Mark the File record status = FAILED (best-effort cleanup).
//     - Return 422 UPLOAD_NOT_COMPLETED.
//
// Step 3 — Atomic transaction
//   Inside a single prisma.$transaction():
//     a. file.update({ status: 'READY', uploadCompletedAt: now })
//     b. storageStats.incrementStorage(userId, file.size)
//   Both writes either commit together or roll back together.
//   This guarantees that usedStorage never diverges from the actual stored bytes.
//
// Step 4 — Return success
//   The client receives a simple success confirmation. The file is now READY
//   and accessible via GET /files/:id and GET /files/:id/download-url.
//
// @param {object} data   — validated body: { fileId }
// @param {string} userId — authenticated user's ID from req.user.id
// ---------------------------------------------------------------------------
export const confirmUpload = async ({ fileId }, userId) => {

  // ── Step 1: Load and validate the File record ─────────────────────────────
  const file = await fileRepository.findById(fileId);

  if (!file) {
    throw createServiceError('File not found.', 404, 'FILE_NOT_FOUND');
  }

  // Ownership check — must be verified before revealing status details.
  if (file.ownerId !== userId) {
    throw createServiceError(
      'You do not have permission to confirm this upload.',
      403,
      'FORBIDDEN',
    );
  }

  // Status guards — only PENDING files can be confirmed.
  if (file.status === 'READY') {
    throw createServiceError(
      'This file has already been successfully uploaded.',
      409,
      'FILE_ALREADY_READY',
    );
  }

  if (file.status === 'FAILED') {
    throw createServiceError(
      'This upload has already failed. Please initiate a new upload.',
      409,
      'FILE_ALREADY_FAILED',
    );
  }

  // Folder guard — only FILE type records can be confirmed.
  // (Defensive check: FOLDER records have no storageKey or PENDING status,
  //  but we guard explicitly for clarity.)
  if (file.type !== 'FILE') {
    throw createServiceError('File not found.', 404, 'FILE_NOT_FOUND');
  }

  // ── Step 2: Verify the object exists in S3 ───────────────────────────────
  // Must run OUTSIDE the Prisma transaction — S3 is not transactional.
  // If S3 confirms the object is missing, mark the record FAILED so the
  // database stays consistent with the actual state of the bucket.
  let exists;
  try {
    exists = await storageService.objectExists(file.storageKey);
  } catch (err) {
    if (err instanceof StorageError) {
      throw createServiceError(
        'Storage service is temporarily unavailable. Please try again.',
        503,
        'STORAGE_UNAVAILABLE',
      );
    }
    throw err;
  }

  if (!exists) {
    // Best-effort: mark the record FAILED. If this update itself fails,
    // the record remains PENDING and will be picked up by the recovery strategy.
    await fileRepository.update(file.id, { status: 'FAILED' });

    throw createServiceError(
      'The file was not found in storage. Please upload the file again.',
      422,
      'UPLOAD_NOT_COMPLETED',
    );
  }

  // ── Step 3: Atomic transaction — mark READY + increment quota ────────────
  // Both writes are committed together. If either fails, neither takes effect,
  // so usedStorage cannot diverge from the set of READY file records.
  await prisma.$transaction(async (tx) => {
    await fileRepository.update(
      file.id,
      {
        status: 'READY',
      },
      tx,
    );

    // file.size is a BigInt (as returned by Prisma for BIGINT columns).
    // incrementStorage accepts BigInt directly — no conversion needed.
    await storageStatsRepository.incrementStorage(userId, file.size, tx);
  });

  // ── Step 4: Return ────────────────────────────────────────────────────────
  return {
    success: true,
    message: 'Upload completed successfully.',
  };
};

// ---------------------------------------------------------------------------
// listFiles
//
// Returns the immediate children of a folder, or the root items, for the
// authenticated user. No recursion — only one level at a time.
//
// Step 1 — Validate parent folder (if parentId supplied)
//   The same ownership/type guards used by initiateUpload apply here.
//   Ownership is checked before type to avoid leaking information about
//   folders belonging to other users.
//
// Step 2 — Fetch items
//   Root:   fileRepository.findRootItems(userId)
//   Folder: fileRepository.findChildren(userId, parentId)
//   Both methods already filter deletedAt: null and order folders first,
//   then alphabetically — no additional sorting needed at this layer.
//
// Step 3 — Map to safe shape
//   storageKey, ownerId, and deletedAt are stripped before returning.
//   size is converted from BigInt to Number for JSON serialisation.
//
// @param {object} query  — validated query: { parentId: number | null }
// @param {string} userId — authenticated user's ID from req.user.id
// ---------------------------------------------------------------------------
export const listFiles = async ({ parentId }, userId) => {

  // ── Step 1: Validate parent folder ───────────────────────────────────────
  if (parentId !== null) {
    const parent = await fileRepository.findById(parentId);

    if (!parent) {
      throw createServiceError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    // Ownership check first — do not reveal folder type for foreign records.
    if (parent.ownerId !== userId) {
      throw createServiceError(
        'You do not have permission to access this folder.',
        403,
        'FORBIDDEN',
      );
    }

    if (parent.type !== 'FOLDER') {
      // parentId points to a file, not a folder — treat as not found.
      throw createServiceError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }
  }

  // ── Step 2: Fetch items ───────────────────────────────────────────────────
  const items = parentId === null
    ? await fileRepository.findRootItems(userId)
    : await fileRepository.findChildren(userId, parentId);

  // ── Step 3: Return ────────────────────────────────────────────────────────
  return {
    success: true,
    data: {
      parentId,
      items: items.map(toSafeFile),
    },
  };
};

// ---------------------------------------------------------------------------
// createFolder
//
// Creates a folder record in the File table.
//
// Step 1 — Validate parent folder (if parentId supplied)
//   Same ownership/type guards used across all folder-aware operations.
//
// Step 2 — Duplicate name check
//   findActiveByName() searches active records only, so soft-deleted items
//   with the same name do not block creation.
//
// Step 3 — Create folder record
//   type = FOLDER, status = READY, size = 0.
//   storageKey = null — folders have no S3 object.
//
// @param {object} data   — validated body: { displayName, parentId }
// @param {string} userId — authenticated user's ID
// ---------------------------------------------------------------------------
export const createFolder = async ({ displayName, parentId }, userId) => {

  // ── Step 1: Validate parent folder ───────────────────────────────────────
  if (parentId !== null) {
    const parent = await fileRepository.findById(parentId);

    if (!parent) {
      throw createServiceError('Parent folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    if (parent.ownerId !== userId) {
      throw createServiceError(
        'You do not have permission to create items in this folder.',
        403,
        'FORBIDDEN',
      );
    }

    if (parent.type !== 'FOLDER') {
      throw createServiceError('Parent folder not found.', 404, 'FOLDER_NOT_FOUND');
    }
  }

  // ── Step 2: Duplicate name check ─────────────────────────────────────────
  const duplicate = await fileRepository.findActiveByName(userId, parentId, displayName);
  if (duplicate) {
    throw createServiceError(
      `A file or folder named "${displayName}" already exists in this location.`,
      409,
      'NAME_CONFLICT',
    );
  }

  // ── Step 3: Create folder record ─────────────────────────────────────────
  // uploadStartedAt is explicitly null — folders have no upload lifecycle.
  const folder = await fileRepository.create({
    ownerId:         userId,
    parentId,
    displayName,
    type:            'FOLDER',
    status:          'READY',
    size:            BigInt(0),
    storageKey:      null,
    mimeType:        null,
    uploadStartedAt: null,
  });

  return {
    success: true,
    data:    toSafeFile(folder),
  };
};

// ---------------------------------------------------------------------------
// renameItem
//
// Renames a file or folder by updating displayName only.
// Does NOT modify storageKey, type, size, status, or parentId.
//
// Step 1 — Load and verify the record
//   findById filters deletedAt: null — soft-deleted items are invisible.
//   Ownership check precedes all other checks.
//
// Step 2 — Duplicate name check inside the current parent
//   Skip the check if the name has not changed (case-preserving same name).
//
// Step 3 — Update displayName
//
// @param {number} id           — file or folder ID from :id route param
// @param {object} data         — validated body: { displayName }
// @param {string} userId       — authenticated user's ID
// ---------------------------------------------------------------------------
export const renameItem = async (id, { displayName }, userId) => {

  // ── Step 1: Load and verify ───────────────────────────────────────────────
  const item = await fileRepository.findById(id);

  if (!item) {
    throw createServiceError('File or folder not found.', 404, 'FILE_NOT_FOUND');
  }

  if (item.ownerId !== userId) {
    throw createServiceError(
      'You do not have permission to rename this item.',
      403,
      'FORBIDDEN',
    );
  }

  // ── Step 2: Duplicate name check ─────────────────────────────────────────
  // Skip if the name is identical (renaming to the same name is a no-op that
  // should succeed rather than return a conflict error).
  if (item.displayName !== displayName) {
    const duplicate = await fileRepository.findActiveByName(userId, item.parentId, displayName);
    if (duplicate) {
      throw createServiceError(
        `A file or folder named "${displayName}" already exists in this location.`,
        409,
        'NAME_CONFLICT',
      );
    }
  }

  // ── Step 3: Update ────────────────────────────────────────────────────────
  const updated = await fileRepository.update(id, { displayName });

  return {
    success: true,
    data:    toSafeFile(updated),
  };
};

// ---------------------------------------------------------------------------
// moveItem
//
// Moves a file or folder to a different parent (or to the root).
// Updates parentId only — storageKey, displayName, status, and size are
// never touched.
//
// Step 1 — Load source and verify ownership.
//
// Step 2 — Validate destination folder (if parentId !== null).
//
// Step 3 — Self-move guard.
//   A folder cannot be moved into itself.
//
// Step 4 — Cycle guard (folders only).
//   Walk the ancestor chain of the destination upward using findById().
//   If we encounter the source folder's ID before reaching root, the move
//   would create a cycle.
//   Traversal: destination → destination.parent → ... → null (root)
//   If source.id is encountered: reject with MOVE_CYCLE.
//   Cycle detection only applies when source.type === FOLDER. Moving a FILE
//   into any folder cannot create a cycle because files have no children.
//
// Step 5 — Duplicate name check inside the destination.
//   Only blocked if another ACTIVE item with the same displayName already
//   exists in the destination.
//
// Step 6 — Update parentId.
//
// @param {number} id     — source file or folder ID from :id route param
// @param {object} data   — validated body: { parentId }
// @param {string} userId — authenticated user's ID
// ---------------------------------------------------------------------------
export const moveItem = async (id, { parentId }, userId) => {

  // ── Step 1: Load source ───────────────────────────────────────────────────
  const source = await fileRepository.findById(id);

  if (!source) {
    throw createServiceError('File or folder not found.', 404, 'FILE_NOT_FOUND');
  }

  if (source.ownerId !== userId) {
    throw createServiceError(
      'You do not have permission to move this item.',
      403,
      'FORBIDDEN',
    );
  }

  // ── Step 2: Validate destination folder ───────────────────────────────────
  if (parentId !== null) {
    const dest = await fileRepository.findById(parentId);

    if (!dest) {
      throw createServiceError(
        'Destination folder not found.',
        404,
        'DEST_FOLDER_NOT_FOUND',
      );
    }

    if (dest.ownerId !== userId) {
      throw createServiceError(
        'You do not have permission to move items into this folder.',
        403,
        'FORBIDDEN',
      );
    }

    if (dest.type !== 'FOLDER') {
      throw createServiceError(
        'Destination folder not found.',
        404,
        'DEST_FOLDER_NOT_FOUND',
      );
    }

    // ── Step 3: Self-move guard ───────────────────────────────────────────
    if (parentId === id) {
      throw createServiceError(
        'A folder cannot be moved into itself.',
        409,
        'MOVE_SELF',
      );
    }

    // ── Step 4: Cycle guard (folders only) ───────────────────────────────
    // Walk upward from dest through its ancestors. If we encounter source.id
    // it means dest is a descendant of source → moving source into dest would
    // create a cycle.
    if (source.type === 'FOLDER') {
      let cursor = dest;
      while (cursor.parentId !== null) {
        // eslint-disable-next-line no-await-in-loop
        cursor = await fileRepository.findById(cursor.parentId);
        if (!cursor) break; // detached subtree — safe to stop
        if (cursor.id === id) {
          throw createServiceError(
            'A folder cannot be moved into one of its own sub-folders.',
            409,
            'MOVE_CYCLE',
          );
        }
      }
    }
  }

  // ── Step 5: Duplicate name check inside destination ───────────────────────
  const duplicate = await fileRepository.findActiveByName(userId, parentId, source.displayName);
  // Exclude the source itself — moving within the same parent keeps the same name.
  if (duplicate && duplicate.id !== id) {
    throw createServiceError(
      `A file or folder named "${source.displayName}" already exists in the destination.`,
      409,
      'NAME_CONFLICT',
    );
  }

  // ── Step 6: Update parentId ───────────────────────────────────────────────
  const updated = await fileRepository.update(id, { parentId });

  return {
    success: true,
    data:    toSafeFile(updated),
  };
};

// ---------------------------------------------------------------------------
// validateFileForAccess — private helper shared by getDownloadUrl and
// getPreviewUrl.
//
// Enforces the common access guards:
//   • Record exists and is active (deletedAt: null — filtered by findById)
//   • Belongs to the authenticated user
//   • type === FILE  (folders have no S3 object)
//   • status === READY (PENDING / FAILED files have no confirmed S3 object)
//
// Returns the file record on success. Throws a typed service error otherwise.
// ---------------------------------------------------------------------------
const validateFileForAccess = async (id, userId) => {
  const file = await fileRepository.findById(id);

  if (!file) {
    throw createServiceError('File not found.', 404, 'FILE_NOT_FOUND');
  }

  if (file.ownerId !== userId) {
    throw createServiceError(
      'You do not have permission to access this file.',
      403,
      'FORBIDDEN',
    );
  }

  if (file.type !== 'FILE') {
    throw createServiceError(
      'Folders cannot be downloaded or previewed.',
      409,
      'NOT_A_FILE',
    );
  }

  if (file.status === 'PENDING') {
    throw createServiceError(
      'This file is still being uploaded.',
      409,
      'FILE_PENDING',
    );
  }

  if (file.status === 'FAILED') {
    throw createServiceError(
      'This file upload failed. Please upload the file again.',
      409,
      'FILE_FAILED',
    );
  }

  return file;
};

// ---------------------------------------------------------------------------
// getDownloadUrl
//
// Generates a temporary presigned GET URL for a client to download the file
// directly from S3. The backend never streams bytes.
//
// Files with status = READY are guaranteed to have a corresponding S3 object
// (enforced by confirmUpload). No objectExists() check is performed here —
// see generateDownloadUrl() in storage.service.js for the caller contract.
//
// @param {number} id     — file ID from route param :id
// @param {string} userId — authenticated user's ID
// ---------------------------------------------------------------------------
export const getDownloadUrl = async (id, userId) => {
  const file = await validateFileForAccess(id, userId);

  let result;
  try {
    result = await storageService.generateDownloadUrl(file.storageKey);
  } catch (err) {
    if (err instanceof StorageError) {
      throw createServiceError(
        'Storage service is temporarily unavailable. Please try again.',
        503,
        'STORAGE_UNAVAILABLE',
      );
    }
    throw err;
  }

  return {
    success:  true,
    url:      result.downloadUrl,
    expiresIn: result.expiresIn,
  };
};

// ---------------------------------------------------------------------------
// getPreviewUrl
//
// Generates a temporary presigned GET URL intended for in-browser preview.
// Delegates to storageService.generatePreviewUrl() which, for MVP, produces
// the same S3 GET URL as download. The method boundary is kept separate so
// future preview-specific behaviour (inline Content-Disposition, image
// transforms) can be added without changing this service or the controller.
//
// @param {number} id     — file ID from route param :id
// @param {string} userId — authenticated user's ID
// ---------------------------------------------------------------------------
export const getPreviewUrl = async (id, userId) => {
  const file = await validateFileForAccess(id, userId);

  let result;
  try {
    result = await storageService.generatePreviewUrl(file.storageKey);
  } catch (err) {
    if (err instanceof StorageError) {
      throw createServiceError(
        'Storage service is temporarily unavailable. Please try again.',
        503,
        'STORAGE_UNAVAILABLE',
      );
    }
    throw err;
  }

  return {
    success:  true,
    url:      result.previewUrl,
    expiresIn: result.expiresIn,
  };
};

// ---------------------------------------------------------------------------
// getActiveDescendants
// Recursively fetches all active children and their children.
// Used for softDelete recursion.
// ---------------------------------------------------------------------------
const getActiveDescendants = async (ownerId, parentId, db) => {
  const children = await fileRepository.findChildren(ownerId, parentId, db);
  let descendants = [...children];
  for (const child of children) {
    if (child.type === 'FOLDER') {
      const childDescendants = await getActiveDescendants(ownerId, child.id, db);
      descendants = descendants.concat(childDescendants);
    }
  }
  return descendants;
};

// ---------------------------------------------------------------------------
// getDeletedDescendants
// Recursively fetches all soft-deleted children and their children.
// Used for restore and permanentlyDelete recursion.
// ---------------------------------------------------------------------------
const getDeletedDescendants = async (ownerId, parentId, db) => {
  const children = await fileRepository.findDeletedChildren(ownerId, parentId, db);
  let descendants = [...children];
  for (const child of children) {
    if (child.type === 'FOLDER') {
      const childDescendants = await getDeletedDescendants(ownerId, child.id, db);
      descendants = descendants.concat(childDescendants);
    }
  }
  return descendants;
};

// ---------------------------------------------------------------------------
// deleteItem (Soft Delete)
// Move an item and all its descendants to the trash by setting deletedAt.
// ---------------------------------------------------------------------------
export const deleteItem = async (id, userId) => {
  const item = await fileRepository.findById(id);

  if (!item) {
    const deletedItem = await fileRepository.findDeletedById(id);
    if (deletedItem && deletedItem.ownerId === userId) {
      throw createServiceError('Item is already in trash.', 409, 'ALREADY_DELETED');
    }
    throw createServiceError('File or folder not found.', 404, 'FILE_NOT_FOUND');
  }

  if (item.ownerId !== userId) {
    throw createServiceError('You do not have permission to delete this item.', 403, 'FORBIDDEN');
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await fileRepository.softDelete(id, now, tx);

    if (item.type === 'FOLDER') {
      const descendants = await getActiveDescendants(userId, id, tx);
      for (const d of descendants) {
        await fileRepository.softDelete(d.id, now, tx);
      }
    }
  });

  return { success: true, message: 'Item moved to trash.' };
};

// ---------------------------------------------------------------------------
// getTrash
// Returns all soft-deleted items owned by the authenticated user.
// ---------------------------------------------------------------------------
export const getTrash = async (userId) => {
  const items = await fileRepository.findTrash(userId);
  return {
    success: true,
    data: items.map(toSafeFile),
  };
};

// ---------------------------------------------------------------------------
// restoreItem
// Restore an item from the trash. If the original parent is missing,
// restores to the root. Recursively restores all descendants.
// ---------------------------------------------------------------------------
export const restoreItem = async (id, userId) => {
  const item = await fileRepository.findDeletedById(id);

  if (!item) {
    const activeItem = await fileRepository.findById(id);
    if (activeItem && activeItem.ownerId === userId) {
      throw createServiceError('Item is already active.', 409, 'ALREADY_ACTIVE');
    }
    throw createServiceError('Item not found in trash.', 404, 'FILE_NOT_FOUND');
  }

  if (item.ownerId !== userId) {
    throw createServiceError('You do not have permission to restore this item.', 403, 'FORBIDDEN');
  }

  let restoreParentId = item.parentId;

  if (restoreParentId !== null) {
    const parent = await fileRepository.findById(restoreParentId);
    if (!parent) {
      restoreParentId = null;
    }
  }

  const duplicate = await fileRepository.findActiveByName(userId, restoreParentId, item.displayName);
  if (duplicate) {
    throw createServiceError(
      `A file or folder named "${item.displayName}" already exists in the destination.`,
      409,
      'NAME_CONFLICT'
    );
  }

  await prisma.$transaction(async (tx) => {
    if (restoreParentId !== item.parentId) {
      await fileRepository.update(id, { parentId: restoreParentId }, tx);
    }
    
    await fileRepository.restore(id, tx);

    if (item.type === 'FOLDER') {
      const descendants = await getDeletedDescendants(userId, id, tx);
      for (const d of descendants) {
        await fileRepository.restore(d.id, tx);
      }
    }
  });

  return { success: true, message: 'Item restored successfully.' };
};

// ---------------------------------------------------------------------------
// permanentlyDeleteItem
// Permanently delete a trashed item. Calls S3 to delete objects first,
// then transactionally hard-deletes DB records and updates StorageStats.
// ---------------------------------------------------------------------------
export const permanentlyDeleteItem = async (id, userId) => {
  const item = await fileRepository.findDeletedById(id);

  if (!item) {
    throw createServiceError('Item not found in trash.', 404, 'FILE_NOT_FOUND');
  }

  if (item.ownerId !== userId) {
    throw createServiceError('You do not have permission to delete this item.', 403, 'FORBIDDEN');
  }

  let storageKeysToDelete = [];
  let descendants = [];

  if (item.type === 'FILE') {
    if (item.storageKey) {
      storageKeysToDelete.push(item.storageKey);
    }
  } else {
    descendants = await getDeletedDescendants(userId, id);
    for (const d of descendants) {
      if (d.type === 'FILE' && d.storageKey) {
        storageKeysToDelete.push(d.storageKey);
      }
    }
  }

  for (const key of storageKeysToDelete) {
    try {
      await storageService.deleteObject(key);
    } catch (err) {
      if (err instanceof StorageError) {
        throw createServiceError(
          'Storage service is temporarily unavailable. Please try again.',
          503,
          'STORAGE_UNAVAILABLE'
        );
      }
      throw err;
    }
  }

  await prisma.$transaction(async (tx) => {
    let totalBytesToReclaim = BigInt(0);

    if (item.type === 'FILE' && item.status === 'READY') {
      totalBytesToReclaim += BigInt(item.size);
    }

    const bottomUp = [...descendants].reverse();

    for (const d of bottomUp) {
      if (d.type === 'FILE' && d.status === 'READY') {
        totalBytesToReclaim += BigInt(d.size);
      }
      await fileRepository.permanentlyDelete(d.id, tx);
    }

    await fileRepository.permanentlyDelete(item.id, tx);

    if (totalBytesToReclaim > BigInt(0)) {
      await storageStatsRepository.decrementStorage(userId, totalBytesToReclaim, tx);
    }
  });

  return { success: true, message: 'Item permanently deleted.' };
};

// ---------------------------------------------------------------------------
// searchFiles
// Searches for active files and folders within a parent (or the root).
// If parentId is undefined, searches the entire drive.
// ---------------------------------------------------------------------------
export const searchFiles = async (query, parentId, userId) => {
  if (parentId !== null && parentId !== undefined) {
    const parent = await fileRepository.findById(parentId);

    if (!parent) {
      throw createServiceError('Parent folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    if (parent.ownerId !== userId) {
      throw createServiceError('Parent folder belongs to another user.', 403, 'FORBIDDEN');
    }

    if (parent.type !== 'FOLDER') {
      throw createServiceError('The specified parent is not a folder.', 422, 'VALIDATION_ERROR');
    }
  }

  const items = await fileRepository.search(userId, query, parentId);

  return {
    success: true,
    data: items.map(toSafeFile),
  };
};

// ---------------------------------------------------------------------------
// getRecentFiles
// Returns the 20 most recently uploaded files for the authenticated user.
// ---------------------------------------------------------------------------
export const getRecentFiles = async (userId) => {
  const items = await fileRepository.findRecent(userId, 20);
  return {
    success: true,
    data: items.map(toSafeFile),
  };
};

// ---------------------------------------------------------------------------
// getProperties
// Returns properties/metadata for a single file or folder.
// ---------------------------------------------------------------------------
export const getProperties = async (id, userId) => {
  const item = await fileRepository.findById(id);

  if (!item) {
    throw createServiceError('Item not found.', 404, 'NOT_FOUND');
  }

  if (item.ownerId !== userId) {
    throw createServiceError('You do not have permission to view this item.', 403, 'FORBIDDEN');
  }

  let childrenCount = 0;
  let foldersCount = 0;
  let filesCount = 0;

  if (item.type === 'FOLDER') {
    const children = await fileRepository.findChildren(userId, id);
    childrenCount = children.length;
    foldersCount = children.filter((c) => c.type === 'FOLDER').length;
    filesCount = children.filter((c) => c.type !== 'FOLDER').length;
  }

  return {
    success: true,
    data: {
      ...toSafeFile(item),
      childrenCount,
      foldersCount,
      filesCount,
    }
  };
};

