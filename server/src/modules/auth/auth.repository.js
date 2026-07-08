// =============================================================================
// auth.repository.js
//
// Responsibility: ALL database access for the auth module.
// Repositories are the ONLY layer that imports Prisma.
// Services call repositories — never import Prisma directly in a service.
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
// Used by: findUserById (authenticate middleware, refresh service)
// ---------------------------------------------------------------------------
const SAFE_USER_SELECT = {
  id:        true,
  name:      true,
  email:     true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
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
// ---------------------------------------------------------------------------
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id:             true,
      name:           true,
      email:          true,
      hashedPassword: true, // required by bcrypt.compare()
      avatarUrl:      true,
      createdAt:      true,
      updatedAt:      true,
    },
  });
};

// ---------------------------------------------------------------------------
// findUserById
//
// Used by: authenticate middleware, refresh service
//
// Never returns hashedPassword — callers of this method have no use for it.
// ---------------------------------------------------------------------------
export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });
};

// ---------------------------------------------------------------------------
// createUser
// Used by: register service
// ---------------------------------------------------------------------------
export const createUser = async ({ name, email, hashedPassword, avatarUrl = null }) => {
  return prisma.user.create({
    data: { name, email, hashedPassword, avatarUrl },
    select: SAFE_USER_SELECT, // never return hashedPassword after creation
  });
};

// ---------------------------------------------------------------------------
// saveRefreshToken
//
// Stores a SHA-256 hash of the raw refresh token.
// The raw token is NEVER persisted — only its hash.
// ---------------------------------------------------------------------------
export const saveRefreshToken = async ({ userId, tokenHash, expiresAt }) => {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
    select: { id: true }, // caller needs no fields — just confirm creation
  });
};

// ---------------------------------------------------------------------------
// findRefreshToken
//
// Used by: logout, refresh service
// Returns isRevoked and expiresAt for validation; userId to load the user.
// ---------------------------------------------------------------------------
export const findRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.findUnique({
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
// ---------------------------------------------------------------------------
export const deleteRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.delete({
    where: { tokenHash },
    select: { id: true }, // caller needs no fields — just confirm deletion
  });
};

// ---------------------------------------------------------------------------
// deleteAllRefreshTokens
// Used by: future "logout everywhere" feature
// ---------------------------------------------------------------------------
export const deleteAllRefreshTokens = async (userId) => {
  return prisma.refreshToken.deleteMany({ where: { userId } });
};
