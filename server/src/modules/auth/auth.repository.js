// =============================================================================
// auth.repository.js
//
// Responsibility: ALL database access for the auth module.
// Repositories are the ONLY layer that imports Prisma.
// Services call repositories — never import Prisma directly in a service.
//
// TRANSACTION SUPPORT:
//   Every method accepts an optional Prisma client (`db = prisma`).
//   This allows Services to pass a transaction client (`tx`) for atomic
//   operations (e.g. createUser inside the registration transaction).
//   Callers that omit `db` continue to use the shared singleton unchanged.
//
// select() strategy:
//   Every query fetches only the columns it actually needs.
//   This reduces network transfer from MySQL, prevents accidental leakage of
//   sensitive fields (hashedPassword), and makes it explicit at the data-access
//   layer what each consumer requires.
// =============================================================================

import prisma from '../../config/prisma.js';

// ---------------------------------------------------------------------------
// Safe user shape — returned wherever hashedPassword is NOT required.
// Used by: findUserById (authenticate middleware, refresh service),
//          createUser (registration — hashedPassword not needed after insert)
// ---------------------------------------------------------------------------
const SAFE_USER_SELECT = {
  id:        true,
  name:      true,
  email:     true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  storageStats: {
    select: {
      usedStorage: true,
      storageLimit: true,
    },
  },
  // hashedPassword intentionally omitted
};

// ---------------------------------------------------------------------------
// findUserByEmail
//
// Used by: register (duplicate check), login (credential lookup)
//
// Returns hashedPassword because bcrypt.compare() requires it for login.
// For the duplicate-check in register, the extra field is negligible since
// we discard the result immediately if the user exists.
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const findUserByEmail = async (email, db = prisma) => {
  return db.user.findUnique({
    where: { email },
    select: {
      id:             true,
      name:           true,
      email:          true,
      hashedPassword: true, // required by bcrypt.compare()
      avatarUrl:      true,
      createdAt:      true,
      updatedAt:      true,
      storageStats: {
        select: {
          usedStorage: true,
          storageLimit: true,
        },
      },
    },
  });
};

// ---------------------------------------------------------------------------
// findUserById
//
// Used by: authenticate middleware, refresh service
//
// Never returns hashedPassword — callers of this method have no use for it.
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const findUserById = async (id, db = prisma) => {
  return db.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });
};

// ---------------------------------------------------------------------------
// createUser
//
// Used by: register service (inside a prisma.$transaction())
//
// Transaction support: accepts an optional Prisma client so the insert can
// be wrapped in the same transaction that creates the StorageStats row.
// Callers that omit `db` continue to use the shared singleton unchanged.
// ---------------------------------------------------------------------------
const createUser = async ({ name, email, hashedPassword, avatarUrl = null }, db = prisma) => {
  return db.user.create({
    data: { name, email, hashedPassword, avatarUrl },
    select: SAFE_USER_SELECT, // never return hashedPassword after creation
  });
};

// ---------------------------------------------------------------------------
// updateUser
// Updates mutable user fields (name, avatarUrl) by ID.
// ---------------------------------------------------------------------------
const updateUser = async (id, data, db = prisma) => {
  return db.user.update({
    where: { id },
    data,
    select: SAFE_USER_SELECT,
  });
};

// ---------------------------------------------------------------------------
// saveRefreshToken
//
// Stores a SHA-256 hash of the raw refresh token.
// The raw token is NEVER persisted — only its hash.
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const saveRefreshToken = async ({ userId, tokenHash, expiresAt }, db = prisma) => {
  return db.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
    select: { id: true }, // caller needs no fields — just confirm creation
  });
};

// ---------------------------------------------------------------------------
// findRefreshToken
//
// Used by: logout, refresh service
// Returns isRevoked and expiresAt for validation; userId to load the user.
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const findRefreshToken = async (tokenHash, db = prisma) => {
  return db.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      tokenHash: true,
      userId:    true,
      expiresAt: true,
      isRevoked: true,
    },
  });
};

// ---------------------------------------------------------------------------
// deleteRefreshToken
// Used by: logout, refresh (rotation cleanup), stale token cleanup
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const deleteRefreshToken = async (tokenHash, db = prisma) => {
  return db.refreshToken.delete({
    where: { tokenHash },
    select: { id: true }, // caller needs no fields — just confirm deletion
  });
};

// ---------------------------------------------------------------------------
// deleteAllRefreshTokens
// Used by: future "logout everywhere" feature
//
// Transaction support: pass a tx client as `db` if needed within a transaction.
// ---------------------------------------------------------------------------
const deleteAllRefreshTokens = async (userId, db = prisma) => {
  return db.refreshToken.deleteMany({ where: { userId } });
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const authRepository = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
};

export default authRepository;
