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

export const initiateUpload = async ({ displayName, mimeType, size, parentId }, userId) => {
  if (parentId !== null) {
    const parent = await fileRepository.findById(parentId);

    if (!parent || parent.ownerId !== userId) {
      throw createServiceError(
        'Parent folder not found.',
        404,
        'FOLDER_NOT_FOUND',
      );
    }

    if (parent.type !== 'FOLDER') {
      throw createServiceError(
        'The specified parent is not a folder.',
        422,
        'VALIDATION_ERROR',
      );
    }
  }

  const storageStats = await storageStatsRepository.findByUserId(userId);

  if (!storageStats) {
    throw createServiceError(
      'Storage stats not found. Please contact support.',
      500,
      'INTERNAL_ERROR',
    );
  }

  const requestedBytes = BigInt(size);

  if (storageStats.usedStorage + requestedBytes > storageStats.storageLimit) {
    throw createServiceError(
      'Upload would exceed your storage quota.',
      413,
      'QUOTA_EXCEEDED',
    );
  }

  const duplicate = await fileRepository.findActiveByName(userId, parentId, displayName);
  if (duplicate) {
    throw createServiceError(
      `A file or folder named "${displayName}" already exists in this location.`,
      409,
      'NAME_CONFLICT',
    );
  }

  const storageKey = `users/${userId}/files/${randomUUID()}`;

  const file = await prisma.$transaction(async (tx) => {
    return await fileRepository.create({
      ownerId:         userId,
      parentId,
      displayName,
      storageKey,
      mimeType,
      size:            requestedBytes,
      type:            'FILE',
      status:          'PENDING',
      uploadStartedAt: new Date(),
    }, tx);
  });

  let uploadResult;
  try {
    uploadResult = await storageService.generateUploadUrl(storageKey, mimeType);
  } catch (err) {
    await fileRepository.permanentlyDelete(file.id);

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
    success: true,
    data: {
      fileId:    file.id,
      storageKey: file.storageKey,
      uploadUrl:  uploadResult.uploadUrl,
      expiresIn:  uploadResult.expiresIn,
    },
  };
};

export const confirmUpload = async ({ fileId }, userId) => {
  const file = await fileRepository.findById(fileId);

  if (!file) {
    throw createServiceError('File not found.', 404, 'FILE_NOT_FOUND');
  }

  if (file.ownerId !== userId) {
    throw createServiceError(
      'You do not have permission to confirm this upload.',
      403,
      'FORBIDDEN',
    );
  }

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

  if (file.type !== 'FILE') {
    throw createServiceError('File not found.', 404, 'FILE_NOT_FOUND');
  }

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
    await fileRepository.update(file.id, { status: 'FAILED' });

    throw createServiceError(
      'The file was not found in storage. Please upload the file again.',
      422,
      'UPLOAD_NOT_COMPLETED',
    );
  }

  await prisma.$transaction(async (tx) => {
    await fileRepository.update(
      file.id,
      {
        status: 'READY',
      },
      tx,
    );

    await storageStatsRepository.incrementStorage(userId, file.size, tx);
  });

  return {
    success: true,
    message: 'Upload completed successfully.',
  };
};

export const listFiles = async ({ parentId }, userId) => {
  if (parentId !== null) {
    const parent = await fileRepository.findById(parentId);

    if (!parent) {
      throw createServiceError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }

    if (parent.ownerId !== userId) {
      throw createServiceError(
        'You do not have permission to access this folder.',
        403,
        'FORBIDDEN',
      );
    }

    if (parent.type !== 'FOLDER') {
      throw createServiceError('Folder not found.', 404, 'FOLDER_NOT_FOUND');
    }
  }

  const items = parentId === null
    ? await fileRepository.findRootItems(userId)
    : await fileRepository.findChildren(userId, parentId);

  return {
    success: true,
    data: {
      parentId,
      items: items.map(toSafeFile),
    },
  };
};

export const createFolder = async ({ displayName, parentId }, userId) => {
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
export const renameItem = async (id, { displayName }, userId) => {
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

  const updated = await fileRepository.update(id, { displayName });

  return {
    success: true,
    data: toSafeFile(updated),
  };
};

export const moveItem = async (id, { parentId }, userId) => {
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

    if (parentId === id) {
      throw createServiceError(
        'A folder cannot be moved into itself.',
        409,
        'MOVE_SELF',
      );
    }

    // Cycle guard for folders
    if (source.type === 'FOLDER') {
      let cursor = dest;
      while (cursor.parentId !== null) {
        cursor = await fileRepository.findById(cursor.parentId);
        if (!cursor) break;
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

  const duplicate = await fileRepository.findActiveByName(userId, parentId, source.displayName);
  if (duplicate && duplicate.id !== id) {
    throw createServiceError(
      `A file or folder named "${source.displayName}" already exists in the destination.`,
      409,
      'NAME_CONFLICT',
    );
  }

  const updated = await fileRepository.update(id, { parentId });

  return {
    success: true,
    data: toSafeFile(updated),
  };
};

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

export const getDownloadUrl = async (id, userId) => {
  const file = await validateFileForAccess(id, userId);

  let result;
  try {
    result = await storageService.generateDownloadUrl(file.storageKey, file.displayName);
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
    success: true,
    url: result.downloadUrl,
    expiresIn: result.expiresIn,
  };
};

export const getPreviewUrl = async (id, userId) => {
  const file = await validateFileForAccess(id, userId);

  let result;
  try {
    result = await storageService.generatePreviewUrl(file.storageKey, file.mimeType, file.displayName);
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
    success: true,
    url: result.previewUrl,
    expiresIn: result.expiresIn,
  };
};

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

export const getTrash = async (userId) => {
  const items = await fileRepository.findTrash(userId);
  return {
    success: true,
    data: items.map(toSafeFile),
  };
};

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

export const getRecentFiles = async (userId) => {
  const items = await fileRepository.findRecent(userId, 20);
  return {
    success: true,
    data: items.map(toSafeFile),
  };
};

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

export const deleteAllUserFiles = async (userId) => {
  const allFiles = await prisma.file.findMany({
    where: { ownerId: userId }
  });

  if (allFiles.length === 0) return;

  const storageKeysToDelete = allFiles
    .filter(f => f.type === 'FILE' && f.storageKey)
    .map(f => f.storageKey);

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

  const depthMap = new Map();
  const getDepth = (id) => {
    if (depthMap.has(id)) return depthMap.get(id);
    const file = allFiles.find(f => f.id === id);
    if (!file || !file.parentId) {
      depthMap.set(id, 0);
      return 0;
    }
    const depth = getDepth(file.parentId) + 1;
    depthMap.set(id, depth);
    return depth;
  };

  allFiles.forEach(f => getDepth(f.id));
  allFiles.sort((a, b) => depthMap.get(b.id) - depthMap.get(a.id));

  await prisma.$transaction(async (tx) => {
    for (const file of allFiles) {
      await tx.file.delete({ where: { id: file.id } });
    }
  });
};

