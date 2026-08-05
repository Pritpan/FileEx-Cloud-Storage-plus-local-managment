// =============================================================================
// storage-stats.repository.js
//
// Responsibility: ALL database access for the StorageStats model.
// Repositories are the ONLY layer that imports Prisma.
//
// TRANSACTION SUPPORT:
//   Every method accepts an optional Prisma client (`db = prisma`).
//   This allows Services to pass a transaction client (`tx`) for atomic
//   operations, e.g. incrementing usedStorage and updating file.status in a
//   single prisma.$transaction() call.
//
// ERROR HANDLING:
//   No HTTP errors are thrown here. Prisma errors bubble naturally to the
//   Service layer, which translates them into typed application errors.
//
// QUOTA VALIDATION:
//   This repository does NOT calculate, check, or enforce quota limits.
//   The Service layer is responsible for all business rules, including:
//     - Checking whether usedStorage + requestedSize <= storageLimit
//     - Deciding whether to proceed with an upload
//   The repository only executes the data operation it is given.
//
// Exactly one StorageStats row exists for every active user. The row is
// created during user registration and is automatically removed when the
// associated User is deleted via ON DELETE CASCADE.
//
// See: docs/DATABASE_DESIGN.md §3.9
// =============================================================================

import prisma from '../../config/prisma.js';

// ---------------------------------------------------------------------------
// create
//
// Inserts a new StorageStats row for a user.
// Called once during user registration (inside the same transaction that
// creates the User row, so the FK constraint is satisfied immediately).
//
// `data` must include:
//   - userId {string} — FK → users.id
//
// Prisma applies schema defaults automatically:
//   - usedStorage  → 0
//   - storageLimit → 104857600 (100 MB)
//
// No validation is performed here. The Service layer guarantees that
// `userId` exists before calling this method.
//
// Transaction support: pass a tx client as `db` to include this insert in
// a larger atomic operation.
// ---------------------------------------------------------------------------
const create = async (data, db = prisma) => {
  return db.storageStats.create({ data });
};

// ---------------------------------------------------------------------------
// findByUserId
//
// Returns the single StorageStats row for a given user, or null if not found.
//
// One row per user is guaranteed by the UNIQUE constraint on `userId`.
// findUnique() is used instead of findFirst() to exploit that constraint —
// it generates an index seek rather than a full scan.
//
// Callers:
//   - FileService.initiateUpload() — quota check before creating PENDING record
//   - StorageDashboardService.getStats() — builds the dashboard payload
//
// Transaction support: pass a tx client as `db` to read within a transaction.
// ---------------------------------------------------------------------------
const findByUserId = async (userId, db = prisma) => {
  return db.storageStats.findUnique({
    where: { userId },
  });
};

// ---------------------------------------------------------------------------
// update
//
// Generic update of the StorageStats row for a user.
// Used for bulk changes such as updating storageLimit (admin operation) or
// any field not covered by the atomic increment/decrement helpers.
//
// A StorageStats row is guaranteed to exist for every active user because it
// is created atomically during registration. A missing row represents a
// programming error (e.g. incomplete registration), not normal business flow.
// Prisma will throw a P2025 "Record to update not found" error in that case,
// which the Service layer can treat as an internal consistency failure.
//
// `userId` is declared @unique in the Prisma schema, so it can be used
// directly in update().where — no separate existence check is required.
//
// Transaction support: pass a tx client as `db`.
// ---------------------------------------------------------------------------
const update = async (userId, data, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data,
  });
};

// ---------------------------------------------------------------------------
// incrementStorage
//
// Atomically increases `usedStorage` by `bytes` using Prisma's `increment`
// operator, which maps to a SQL `SET usedStorage = usedStorage + ?` statement.
//
// WHY ATOMIC:
//   A plain read-modify-write (read current value, add bytes, write back)
//   would create a race condition if two upload confirmations arrive
//   concurrently for the same user. The increment operator pushes the
//   arithmetic into MySQL itself, making the update atomic within a
//   single statement — no read-modify-write cycle occurs.
//
// WHY NO QUOTA CHECK:
//   Quota validation belongs in the Service layer (before POST /upload/initiate).
//   By the time POST /upload/complete reaches this method, the quota has
//   already been checked and the S3 object has been confirmed to exist.
//   Checking again here would be redundant and would misplace business logic.
//
// A StorageStats row is guaranteed to exist for every active user. If the row
// is unexpectedly missing, Prisma throws P2025 and the Service layer handles
// it as an internal consistency error.
//
// Transaction support: pass a tx client as `db` to execute this increment
// atomically alongside a file.update({ status: 'READY' }) and a
// notification.create() in a single prisma.$transaction().
// ---------------------------------------------------------------------------
const incrementStorage = async (userId, bytes, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data: {
      usedStorage: { increment: bytes },
    },
  });
};

// ---------------------------------------------------------------------------
// decrementStorage
//
// Atomically decreases `usedStorage` by `bytes` using Prisma's `decrement`
// operator, which maps to a SQL `SET usedStorage = usedStorage - ?` statement.
//
// WHY ATOMIC:
//   Same reasoning as incrementStorage — the decrement operator eliminates
//   the read-modify-write race condition. Two concurrent permanent-delete
//   operations for the same user cannot corrupt each other's accounting.
//
// WHY NO NEGATIVE-VALUE GUARD:
//   Protecting against usedStorage going below 0 is a Service-layer concern.
//   The Service guarantees that decrementStorage is only called with a `bytes`
//   value that cannot underflow the current usedStorage (i.e., it was
//   previously incremented by exactly that value upon upload confirmation).
//   Duplicating that guard here would scatter business logic across layers.
//
//   Note: MySQL BIGINT can go negative — the schema does not have a CHECK
//   constraint. Correctness is enforced by the Service layer.
//
// A StorageStats row is guaranteed to exist for every active user. If the row
// is unexpectedly missing, Prisma throws P2025 and the Service layer handles
// it as an internal consistency error.
//
// Transaction support: pass a tx client as `db` to execute this decrement
// atomically alongside a file.delete() in a single prisma.$transaction().
// ---------------------------------------------------------------------------
const decrementStorage = async (userId, bytes, db = prisma) => {
  return db.storageStats.update({
    where: { userId },
    data: {
      usedStorage: { decrement: bytes },
    },
  });
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const storageStatsRepository = {
  create,
  findByUserId,
  update,
  incrementStorage,
  decrementStorage,
};

export default storageStatsRepository;
