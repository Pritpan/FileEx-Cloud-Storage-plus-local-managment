// =============================================================================
// file.repository.js
//
// Responsibility: ALL database access for the File model.
// Repositories are the ONLY layer that imports Prisma.
//
// MOVED FROM: src/modules/storage/repositories/file.repository.js
// The File model is owned by the Files domain, not the Storage infrastructure.
//
// TRANSACTION SUPPORT:
//   Every method accepts an optional Prisma client (`db = prisma`).
//   This allows Services to pass a transaction client (`tx`) for atomic operations.
//
// ACTIVE RECORD FILTERING & UPDATE SAFETY:
//   - All standard "find" methods filter out soft-deleted items (`deletedAt: null`).
//   - update() ignores soft-deleted items.
//   - softDelete() ignores already deleted items.
//   - restore() ignores active items (only operates on trashed items).
//   - permanentlyDelete() only removes trashed items.
// =============================================================================

import prisma from '../../config/prisma.js';

// ---------------------------------------------------------------------------
// create
// Creates a File record (either file or folder based on data.type).
// No business logic or uniqueness checks — handled entirely by Service layer.
// ---------------------------------------------------------------------------
const create = async (data, db = prisma) => {
  return db.file.create({
    data,
  });
};

// ---------------------------------------------------------------------------
// findById
// Returns a single active file or folder by ID.
// Implicitly filters out soft-deleted records.
// Intentionally reused internally by update() and softDelete() to avoid
// duplicated lookup logic.
// ---------------------------------------------------------------------------
const findById = async (id, db = prisma) => {
  return db.file.findFirst({
    where: { 
      id,
      deletedAt: null,
    },
  });
};

// ---------------------------------------------------------------------------
// findDeletedById
// Returns exactly one deleted record by ID.
// Used by Restore, Permanent Delete, and Trash Preview.
// Intentionally reused internally by restore() and permanentlyDelete() to
// avoid duplicated lookup logic.
// ---------------------------------------------------------------------------
const findDeletedById = async (id, db = prisma) => {
  return db.file.findFirst({
    where: {
      id,
      deletedAt: { not: null },
    },
  });
};

// ---------------------------------------------------------------------------
// findByStorageKey
// Returns a single active file by its immutable storageKey.
// Implicitly filters out soft-deleted records.
// ---------------------------------------------------------------------------
const findByStorageKey = async (storageKey, db = prisma) => {
  return db.file.findFirst({
    where: { 
      storageKey,
      deletedAt: null,
    },
  });
};

// ---------------------------------------------------------------------------
// findRootItems
// Returns all active items for a user at the root (parentId = NULL).
// Ordering: Folders first, then displayName ascending.
// Note: `type: 'desc'` sorts folders before files because it depends on the
// FileType enum ordering defined in the DB (FILE then FOLDER).
// ---------------------------------------------------------------------------
const findRootItems = async (ownerId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      parentId: null,
      deletedAt: null,
    },
    orderBy: [
      { type: 'desc' }, // Folders first
      { displayName: 'asc' },
    ],
  });
};

// ---------------------------------------------------------------------------
// findChildren
// Returns active children for a specific folder.
// Ordering: Folders first, then displayName ascending.
// Note: `type: 'desc'` sorts folders before files because it depends on the
// FileType enum ordering defined in the DB (FILE then FOLDER).
// ---------------------------------------------------------------------------
const findChildren = async (ownerId, parentId, db = prisma) => {
  return db.file.findMany({
    where: {
      ownerId,
      parentId,
      deletedAt: null,
    },
    orderBy: [
      { type: 'desc' }, // Folders first
      { displayName: 'asc' },
    ],
  });
};

// ---------------------------------------------------------------------------
// findActiveByName
// Searches for an active record by exact name in a specific parent folder.
// Used by Service layer for name conflict validation (create, rename, move, copy).
// ---------------------------------------------------------------------------
const findActiveByName = async (ownerId, parentId, displayName, db = prisma) => {
  return db.file.findFirst({
    where: {
      ownerId,
      parentId,
      displayName,
      deletedAt: null,
    },
  });
};

// ---------------------------------------------------------------------------
// update
// Generic update method for a single file or folder.
// SAFETY: Only updates active records. Returns null if already deleted.
// ---------------------------------------------------------------------------
const update = async (id, data, db = prisma) => {
  // Prisma does not allow filtering by non-unique fields in update().where
  // so we verify active status first.
  const existing = await findById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data,
  });
};

// ---------------------------------------------------------------------------
// softDelete
// Updates deletedAt for a single file/folder.
// SAFETY: Only updates active records. Returns null if already deleted.
// Does NOT recursively delete children (Service layer handles recursion).
// ---------------------------------------------------------------------------
const softDelete = async (id, deletedAt, db = prisma) => {
  const existing = await findById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data: { deletedAt },
  });
};

// ---------------------------------------------------------------------------
// restore
// Sets deletedAt = NULL to restore an item from trash back to active status.
// SAFETY: Only restores trashed items. Returns null if already active.
// ---------------------------------------------------------------------------
const restore = async (id, db = prisma) => {
  const existing = await findDeletedById(id, db);
  if (!existing) return null;

  return db.file.update({
    where: { id },
    data: { deletedAt: null },
  });
};

// ---------------------------------------------------------------------------
// permanentlyDelete
// Hard deletes the database row.
// SAFETY: Only deletes trashed items. Returns null if active.
// S3 object deletion must be handled by the Service layer prior/concurrently.
// ---------------------------------------------------------------------------
const permanentlyDelete = async (id, db = prisma) => {
  const existing = await findDeletedById(id, db);
  if (!existing) return null;

  return db.file.delete({
    where: { id },
  });
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const fileRepository = {
  create,
  findById,
  findDeletedById,
  findByStorageKey,
  findRootItems,
  findChildren,
  findActiveByName,
  update,
  softDelete,
  restore,
  permanentlyDelete,
};

export default fileRepository;
