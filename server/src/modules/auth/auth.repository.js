// =============================================================================
// auth.repository.js
//
// Responsibility: ALL database access for the auth module.
// Repositories are the ONLY layer that imports Prisma.
// Services call repositories — never import Prisma directly in a service.
// =============================================================================

import prisma from '../../config/prisma.js';

// ---------------------------------------------------------------------------
// findUserByEmail
// Used by: register (duplicate check), login (credential lookup)
// ---------------------------------------------------------------------------
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

// ---------------------------------------------------------------------------
// findUserById
// Used by: authenticate middleware (token payload → user object)
// ---------------------------------------------------------------------------
export const findUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

// ---------------------------------------------------------------------------
// createUser
// Used by: register service
// ---------------------------------------------------------------------------
export const createUser = async ({ name, email, hashedPassword, avatarUrl = null }) => {
  return prisma.user.create({
    data: { name, email, hashedPassword, avatarUrl },
  });
};

// ---------------------------------------------------------------------------
// saveRefreshToken
// Stores a SHA-256 hash of the raw refresh token.
// The raw token is NEVER persisted — only its hash.
// ---------------------------------------------------------------------------
export const saveRefreshToken = async ({ userId, tokenHash, expiresAt }) => {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
};

// ---------------------------------------------------------------------------
// findRefreshToken
// Used by: logout (verify token exists before deleting)
// ---------------------------------------------------------------------------
export const findRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
};

// ---------------------------------------------------------------------------
// deleteRefreshToken
// Used by: logout (invalidate one session)
// ---------------------------------------------------------------------------
export const deleteRefreshToken = async (tokenHash) => {
  return prisma.refreshToken.delete({ where: { tokenHash } });
};

// ---------------------------------------------------------------------------
// deleteAllRefreshTokens
// Used by: future "logout everywhere" feature
// ---------------------------------------------------------------------------
export const deleteAllRefreshTokens = async (userId) => {
  return prisma.refreshToken.deleteMany({ where: { userId } });
};
